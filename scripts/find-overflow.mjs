import { spawn } from 'child_process';

async function findOverflow() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--window-size=1280,800',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:3000/'
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2500));
    const versionRes = await fetch('http://127.0.0.1:9444/json');
    const tabs = await versionRes.json();
    const tab = tabs.find((t) => t.type === 'page');
    if (!tab) throw new Error('No tab');

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let id = 1;
    const send = (method, params = {}) => {
      const msgId = id++;
      return new Promise((resolve) => {
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await new Promise((resolve) => ws.addEventListener('open', resolve));
    await send('Runtime.enable');
    await new Promise((r) => setTimeout(r, 2000));

    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;

        const overflowing = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.right > docWidth + 1 || rect.left < -1) {
            overflowing.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              rect: { left: rect.left, right: rect.right, width: rect.width },
              docWidth
            });
          }
        }
        return {
          docWidth,
          scrollWidth,
          bodyScrollWidth,
          hasHorizontalScroll: scrollWidth > docWidth,
          overflowCount: overflowing.length,
          topOverflowElements: overflowing.slice(0, 15)
        };
      })()`,
      returnByValue: true
    });

    console.log('OVERFLOW ANALYSIS RESULT:');
    console.log(JSON.stringify(res.result?.value, null, 2));

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

findOverflow();
