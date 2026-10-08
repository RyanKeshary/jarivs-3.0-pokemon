import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');

const events = [
  {
    id: 'project-exhibition',
    name: 'Poké Expo: Project Exhibition',
    subtitle: 'Technical Hardware & Software Showcase',
    description: 'Display working prototypes, computational systems, and deployed software solutions to academic adjudicators and industry peers.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '10:00 AM - 01:00 PM',
    min_team_size: 1,
    max_team_size: 4,
    fee: 'Free',
    capacity: 50,
    pokemon: 'porygon',
    rules: [
      'Each squad must present a working hardware apparatus or deployed software prototype.',
      'Original engineering work with documented Git commits required.',
      '10-minute oral technical defense and jury interrogation.'
    ],
    rounds: ['Round 1: Preliminary Bench Review & Inspection', 'Round 2: Grand Jury Defense'],
    prize: 'Worth ₹15,000'
  },
  {
    id: 'pid-geotto',
    name: 'PID-geotto: Line Follower Robot',
    subtitle: 'Autonomous High-Curvature Speed Sprint',
    description: 'Autonomous wheeled robotic vehicles navigate tight-radius optical tracks with closed-loop PID microcontroller calibration.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '01:30 PM - 04:30 PM',
    min_team_size: 1,
    max_team_size: 3,
    fee: 'Free',
    capacity: 40,
    pokemon: 'pidgeotto',
    rules: [
      'Robots must operate fully autonomously with on-board computing and sensors.',
      '30mm track with right-angle vertices, grid crossings, and hairpin turns.',
      'Three official time trials per bot; lowest clean lap time wins.'
    ],
    rounds: ['Round 1: Qualifying Time Trial Lap', 'Round 2: Championship Fast-Track Final'],
    prize: 'Worth ₹12,000'
  },
  {
    id: 'treasure-hunt',
    name: "Team Rocket's Pokéquest: Treasure Hunt",
    subtitle: 'Cryptic Clues & Campus Exploration Quest',
    description: 'Solve cryptic riddles, algorithmic GPS geo-caches, and technical clues across campus to outwit Team Rocket and retrieve the legendary artifacts.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '11:30 AM - 02:30 PM',
    min_team_size: 2,
    max_team_size: 4,
    fee: 'Free',
    capacity: 60,
    pokemon: 'meowth',
    rules: [
      'Teams decipher sequential technical ciphers and physical clue checkpoints.',
      'Speed, strategic routing, and puzzle-solving accuracy dictate point totals.',
      'Strict campus boundary adherence; no interference with other squads.'
    ],
    rounds: ['Stage 1: Cipher Broadcast & Geocache Hunt', 'Stage 2: Vault Infiltration & Speed Recovery'],
    prize: 'Worth ₹10,000'
  },
  {
    id: 'quiz-tle',
    name: 'Quiz-tle: Technical Quiz',
    subtitle: 'Algorithmic Systems & Tech Knowledge Tournament',
    description: 'A rigorous intellectual tournament examining core computer systems, data structures, algorithms, discrete math, and computing history.',
    day_label: 'Day 1 & Day 2',
    days: ['Day 1', 'Day 2'],
    mode: 'In-Person',
    slot_time: 'Day 1 02:00 PM / Day 2 10:00 AM',
    min_team_size: 2,
    max_team_size: 2,
    fee: 'Free',
    capacity: 60,
    pokemon: 'squirtle',
    rules: [
      'Teams strictly consist of pairs (exactly 2 members).',
      'Zero electronic devices or external reference aids permitted.',
      'Top eight teams from Day 1 advance to the Day 2 stage buzzer finals.'
    ],
    rounds: ['Day 1 (16 Oct): Written Prelims & Rapid Buzzer Round', 'Day 2 (17 Oct): Grand Finals with Negative Scoring'],
    prize: 'Worth ₹10,000'
  },
  {
    id: 'build-asor',
    name: 'Builda-saur: Buildathon (Day 1 & Day 2 r2)',
    subtitle: 'Two-Day Hybrid Engineering Endurance Sprint',
    description: 'A grueling multi-phase software development crucible: Day 1 open architecture connected synthesis, followed by Day 2 air-gapped offline compilation.',
    day_label: 'Day 1 & Day 2',
    days: ['Day 1', 'Day 2'],
    mode: 'Hybrid',
    slot_time: 'Day 1 10:00 AM / Day 2 09:00 AM',
    min_team_size: 2,
    max_team_size: 4,
    fee: 'Free',
    capacity: 50,
    pokemon: 'bulbasaur',
    rules: [
      'Day 1 allows unrestricted online libraries, research, and API integrations.',
      'Day 2 is strictly air-gapped without internet access to evaluate offline execution.',
      'Teams deliver verified local binaries, transparent Git commits, and defenses.'
    ],
    rounds: ['Day 1 (16 Oct): Connected Architecture Sprint', 'Day 2 (17 Oct): Air-Gapped Code Freeze & Jury Defense'],
    prize: 'Worth ₹25,000'
  },
  {
    id: 'snorreelax',
    name: 'Snorreelax: Reel Making Competition',
    subtitle: 'Short-Form Documentary & Cinematic Chronicle',
    description: 'Capture the kinetic spirit, intellectual tension, and natural-history aesthetic of Jarvis 3.0 in short-form cinematic documentary reels.',
    day_label: 'Day 1',
    days: ['Day 1'],
    mode: 'In-Person',
    slot_time: '10:00 AM - 05:00 PM',
    min_team_size: 1,
    max_team_size: 2,
    fee: 'Free',
    capacity: 50,
    pokemon: 'snorlax',
    rules: [
      'All footage must be recorded on campus grounds during Day 1.',
      'Final video running length must strictly fall between 45 and 90 seconds.',
      'Adjudication on narrative rhythm, visual grading, and sound design.'
    ],
    rounds: ['Round 1: On-Site Cinematography & Assembly Cut', 'Round 2: Main Stage Screening & Grand Award'],
    prize: 'Worth ₹8,000'
  },
  {
    id: 'cad-mander',
    name: 'Cad-Mander: AutoCAD Design Competition',
    subtitle: 'Parametric CAD Drafting & 3D Solid Assembly',
    description: 'Rapid drafting under dimensional tolerances spanning 2D foundational blueprints to complex 3D kinematic assemblies under stress load simulation.',
    day_label: 'Day 2',
    days: ['Day 2'],
    mode: 'In-Person',
    slot_time: '11:00 AM - 02:00 PM',
    min_team_size: 1,
    max_team_size: 2,
    fee: 'Free',
    capacity: 35,
    pokemon: 'charmander',
    rules: [
      'Official CAD laboratory workstations provided with certified environments.',
      'Absolute adherence to geometric dimensioning and tolerancing (GD&T).',
      'Precision drafting in 2D followed by parametric 3D assembly challenge.'
    ],
    rounds: ['Stage 1: Orthographic & Isometric Precision Drafting', 'Stage 2: Parametric 3D Solid Assembly & Stress Simulation'],
    prize: 'Worth ₹10,000'
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
  console.log('Successfully synced all 7 events from docx into Supabase fest_events table!');
  const all = await sql`SELECT id, name, pokemon FROM public.fest_events ORDER BY id`;
  console.log('Events in DB:', all);
  process.exit(0);
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
