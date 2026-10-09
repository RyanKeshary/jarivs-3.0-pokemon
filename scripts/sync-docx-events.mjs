import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');

const events = [
  {
    id: 'project-exhibition',
    name: 'Poké Expo: Project Exhibition',
    subtitle: 'Technical Hardware & Software Showcase',
    description: 'Display working prototypes, hardware apparatus, and deployed computational systems to academic adjudicators and industry peers.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 1,
    max_team_size: 4,
    fee: 'Free',
    capacity: 50,
    pokemon: 'porygon',
    rules: [
      'Each squad must demonstrate a live physical apparatus or working deployed software demonstration.'
    ],
    rounds: ['Round 1: Preliminary Bench Review & Technical Inspection', 'Round 2: Grand Jury Defense & Adjudicator Scrutiny'],
    prize: ''
  },
  {
    id: 'pid-geotto',
    name: 'Pidgetto: Line-Follower Race',
    subtitle: 'Line-Follower Race',
    description: 'Autonomous wheeled robotic vehicles navigate precision tracks calibrated for high-speed line tracking and closed-loop control.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 1,
    max_team_size: 3,
    fee: 'Free',
    capacity: 40,
    pokemon: 'pidgeotto',
    rules: [
      'Line will be a black stripe on a white surface.',
      'The device should not be controlled by ANY external device or remote.'
    ],
    rounds: ['Round 1: Qualifying Time Trial Lap', 'Round 2: Championship Fast-Track Eliminator'],
    prize: ''
  },
  {
    id: 'treasure-hunt',
    name: "Team Rocket's Pokéquest: Treasure Hunt",
    subtitle: 'Treasure Hunt',
    description: 'Solve cryptic riddles, algorithmic GPS geo-caches, and technical clues across campus to outwit Team Rocket and retrieve the legendary artifacts.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 2,
    max_team_size: 4,
    fee: 'Free',
    capacity: 60,
    pokemon: 'meowth',
    rules: [
      'Teams decipher sequential technical ciphers and physical clue checkpoints.',
      'Speed, strategic routing, and puzzle-solving accuracy dictate point totals.',
      'Strict campus boundary adherence; zero interference with rival squads.'
    ],
    rounds: ['Stage 1: On-Day Chaos'],
    prize: ''
  },
  {
    id: 'quiz-tle',
    name: 'Quiztle: Technical Quiz',
    subtitle: 'Technical Quiz',
    description: 'A rigorous intellectual tournament examining core computer systems, data structures, algorithms, discrete math, and computing history.',
    day_label: 'Day 2',
    days: ['Day 2'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 2,
    max_team_size: 2,
    fee: 'Free',
    capacity: 60,
    pokemon: 'squirtle',
    rules: [
      'Squads must strictly comprise exactly two individuals.',
      'Zero external communication devices or reference aids permitted.',
      'Finalist teams will compete in the Day 2 live stage buzzer finals.'
    ],
    rounds: [],
    prize: ''
  },
  {
    id: 'build-asor',
    name: 'Buildasaur: Buildathon',
    subtitle: 'Buildathon',
    description: 'A multi-phase software development crucible: Day 1 open architecture and development sprint, followed by Round 2 prototype completion and jury defense.',
    day_label: 'Day 1 & Day 2',
    days: ['Day 1', 'Day 2'],
    mode: 'Hybrid',
    slot_time: '',
    min_team_size: 2,
    max_team_size: 4,
    fee: 'Free',
    capacity: 50,
    pokemon: 'bulbasaur',
    rules: [
      'Day 1 allows unrestricted online libraries, research publications, and external API gateways.',
      'Round 2 features prototype completion, code freeze, and architectural defense.',
      'Teams deliver working prototypes, transparent Git commit logs, and product presentations.'
    ],
    rounds: [
      'Round 1: Product Architecture & Engineering Sprint (Day 1)',
      'Round 2: Prototype Finalization & Grand Jury Defense (Day 2)'
    ],
    prize: ''
  },
  {
    id: 'snorreelax',
    name: 'Snorreelax: Reel Making Competition',
    subtitle: 'Reel Making Competition',
    description: 'Capture the kinetic spirit, intellectual tension, and creative atmosphere of Jarvis 3.0 in short-form cinematic documentary reels.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 1,
    max_team_size: 2,
    fee: 'Free',
    capacity: 50,
    pokemon: 'snorlax',
    rules: [
      'All footage must be recorded on campus grounds during Day 1 of the fest.',
      'Final video running length must strictly fall between 45 and 90 seconds.',
      'Adjudication evaluates visual grading, sound design, rhythm, and editorial cohesion.'
    ],
    rounds: ['Round 1: On-Site Cinematography & Assembly Cut', 'Round 2: Main Auditorium Screening & Adjudication'],
    prize: ''
  },
  {
    id: 'cad-mander',
    name: 'Cadmander: AutoCAD Competition',
    subtitle: '2D AutoCAD Drafting',
    description: 'Rapid drafting competition under dimensional tolerances focusing exclusively on 2D AutoCAD engineering blueprints.',
    day_label: 'Day 2',
    days: ['Day 2'],
    mode: 'In-Person',
    slot_time: '',
    min_team_size: 1,
    max_team_size: 2,
    fee: 'Free',
    capacity: 35,
    pokemon: 'charmander',
    rules: [
      'Official CAD laboratory workstations provided with certified AutoCAD environments.',
      'Absolute adherence to geometric dimensioning, tolerancing (GD&T), and projection conventions.',
      'The competition focuses strictly on 2D AutoCAD drafting.'
    ],
    rounds: ['Round 1: 2D Orthographic & Precision Blueprint Drafting'],
    prize: ''
  }
];

async function sync() {
  for (const ev of events) {
    await sql`
      INSERT INTO public.fest_events (id, name, subtitle, description, day_label, days, mode, slot_time, min_team_size, max_team_size, fee, capacity, is_open, pokemon, rules, rounds, prize)
      VALUES (${ev.id}, ${ev.name}, ${ev.subtitle}, ${ev.description}, ${ev.day_label}, ${ev.days}, ${ev.mode}, ${ev.slot_time}, ${ev.min_team_size}, ${ev.max_team_size}, ${ev.fee}, ${ev.capacity}, true, ${ev.pokemon}, ${ev.rules}, ${ev.rounds}, ${ev.prize})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        day_label = EXCLUDED.day_label,
        days = EXCLUDED.days,
        mode = EXCLUDED.mode,
        slot_time = EXCLUDED.slot_time,
        min_team_size = EXCLUDED.min_team_size,
        max_team_size = EXCLUDED.max_team_size,
        fee = EXCLUDED.fee,
        capacity = EXCLUDED.capacity,
        pokemon = EXCLUDED.pokemon,
        rules = EXCLUDED.rules,
        rounds = EXCLUDED.rounds,
        prize = EXCLUDED.prize;
    `;
  }
  console.log('Successfully synced all 7 events with updated rules and specifications!');
  await sql.end();
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
