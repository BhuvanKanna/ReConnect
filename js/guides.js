// What the patient reads before each exercise starts (the setup sheet in js/engine.js).
// Written for older adults after a stroke and for children: short sentences, everyday words, one action
// per step, and every step spelled out. Keep it that way when editing (aim for 10 words or fewer a sentence).
// One entry per exercise id:
//   goal   what you do, then what happens in the game (one or two short sentences)
//   ready  how to sit or stand and what to have ready (the phone grip itself is the exercise's `mount`)
//   steps  4 or 5 numbered steps in order (<b> marks the key action)
//   rep    what counts as one (shown as "That is one lift: ..."); left out for timed exercises
//   tip    one short cue for doing it well
//   unit   the word for one, for "Today: 10 lifts" ("glass|glasses" when the plural is irregular)
//   safe   optional: replaces the standard safety line chosen from the exercise's position
// The "Move like this" pictures are in js/moveart.js.
(() => {
"use strict";
const RC = window.RC;
const G = {};
// Phrases many exercises share, so they read the same everywhere.
const HOLD = "<b>Hold still</b> until the green bar is full.";
const HOLDBAND = "<b>Hold it there.</b> The box at the top counts down.";

// ---------------------------------------------------------------- Arm & shoulder
G.lift = { unit: "lift",
  goal: "Lift your arm up high. The lantern goes up into the gold ring!",
  ready: "Sit up tall at a table. Rest your arm on the table.",
  steps: ["Hold the phone in your fist. <b>Screen up.</b>", "<b>Lift your arm up</b> in front of you. Keep it straight.", "Stop when the lantern is in the <b>gold ring</b>.", HOLD, "<b>Put your arm down</b> slowly on the table."],
  rep: "Up, hold, down.",
  tip: "Keep your shoulder down, away from your ear." };
G.sideraise = { unit: "raise",
  goal: "Lift your arm out to the side. The scarecrow copies you, and a bird lands on its hand!",
  ready: "Sit up tall. Let your arm hang down by your side.",
  steps: ["Hold the phone in your fist, <b>pointing at the floor</b>.", "<b>Lift your arm out to the side.</b> Keep it straight.", "Stop when the dot on the bar is in the <b>green</b>.", HOLD, "<b>Put your arm down</b> slowly."],
  rep: "Out to the side, hold, down.",
  tip: "Keep your body straight. Only your arm moves." };
G.reach = { unit: "window",
  goal: "Shine your torch on the window with the green ring. The light comes on and someone waves!",
  ready: "Sit up tall. Face the screen.",
  steps: ["Hold the phone like a torch. <b>Point it at the screen.</b>", "Find the window with the <b>green ring</b>.", "<b>Move your whole arm</b> to point at it.", "<b>Hold still</b> until the light comes on.", "A new window gets the ring. Point at that one."],
  rep: "Point at a window until its light comes on.",
  tip: "Move from your shoulder, not just your wrist." };
G.cupmouth = { unit: "sip",
  goal: "Lift the hot cocoa to your mouth for a sip. Then put it back down.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone <b>standing up</b> in your fist, like a mug.", "<b>Bend your elbow.</b> Bring the phone up to your mouth.", "Tip it toward you a little, like a sip.", "<b>Hold it there</b> until the green bar is full.", "<b>Put it back down</b> on the table slowly."],
  rep: "Up to your mouth, hold, back down.",
  tip: "Sit back in the chair. Bring the cup to you." };
G.push = { unit: "push",
  goal: "Push the curling stone across the ice. The penguins sweep in front of it!",
  ready: "Sit up tall. Hold your hand close to your chest.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Keep still</b> for a moment.", "<b>Push your hand straight out</b> in front of you.", "Make your arm straight.", "<b>Bring your hand back</b> to your chest. Keep still again."],
  rep: "Push out and come back.",
  tip: "Sit back in the chair. Only your arm moves." };
G.trace = { unit: "shape",
  goal: "Fly the little plane along the dotted line in the sky. It draws as it flies!",
  ready: "Sit up tall. Face the screen.",
  steps: ["Hold the phone like a torch. <b>Point it at the screen.</b>", "<b>Point at the orange dot.</b> That is the start.", "<b>Move your arm slowly</b> along the dotted line.", "Keep going to the end of the line.", "Then a new shape comes."],
  rep: "From the orange dot to the end of the line.",
  tip: "Go slowly. If you slip off, just come back to the line." };
G.gate = { unit: "swing",
  goal: "Open the farm gate with your arm. The sheep walks through!",
  ready: "Sit up tall. Put your elbow against your side. Bend it so your hand points forward.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "Keep your <b>elbow against your side</b>.", "<b>Swing your hand out</b> to the side, like opening a gate.", "<b>Hold it open</b> while the sheep walks through.", "<b>Swing your hand back</b> to the front."],
  rep: "Open, hold, close.",
  tip: "Your elbow stays touching your side the whole time." };
G.paint = { unit: "stroke",
  goal: "Paint the fence with big brush strokes. Up, then down!",
  ready: "Sit up tall. Hold your arm out in front of you.",
  steps: ["Hold the phone in your fist, like a paintbrush.", "<b>Lift your arm up</b> to the top.", "<b>Bring your arm down</b> to the bottom.", "Keep going <b>up and down</b>, nice and steady.", "Each stroke paints a board of the fence."],
  rep: "One stroke up and one stroke down.",
  tip: "Make big, slow strokes with your whole arm." };
G.pendulum = { unit: "swing",
  goal: "Swing your arm gently, like a pendulum. The bunny on the swing goes with you!",
  ready: "Stand by a table. Put your good hand on it. Lean forward a little.",
  steps: ["Hold the phone in your fist, <b>pointing at the floor</b>.", "Let your arm <b>hang down loose</b>.", "<b>Rock your body gently.</b> Your arm swings to one side.", "Let it <b>swing to the other side</b>.", "Keep it slow and gentle."],
  rep: "One swing to each side.",
  tip: "Let your body move the arm. Keep the arm relaxed." };
G.pressdown = { unit: "press",
  goal: "Push the handle of the water pump down. A duckling comes to swim!",
  ready: "Sit up tall. Bend your elbow so your hand is up near your shoulder.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Push your hand down</b> until your arm is straight.", "<b>Hold it down</b> until the green bar is full.", "<b>Let your hand come back up</b> slowly.", "Get ready for the next one."],
  rep: "Push down, hold, come back up.",
  tip: "Keep your upper arm still. Only your elbow moves." };
G.tennis = { unit: "swing",
  goal: "Hit the tennis balls! Swing one way, then the other way.",
  ready: "Sit or stand with your arm in front of you. Put the wrist strap on.",
  steps: ["Hold the phone tight, like a racket.", "<b>Swing across</b> to one side to hit the ball.", "<b>Swing across</b> to the other side for the next ball.", "The box at the top shows which side is next.", "Keep going, side to side."],
  rep: "One swing each way.",
  tip: "Hold on tight. Smooth swings, not fast ones." };
G.airplane = { unit: "flight",
  goal: "Hold your arm out like a plane wing. The plane flies through the gold rings!",
  ready: "Sit up tall. Let your arm hang down by your side.",
  steps: ["Hold the phone in your fist, <b>pointing at the floor</b>.", "<b>Lift your arm out to the side.</b> Keep it straight.", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Put your arm down</b> and rest."],
  rep: "Lift, hold until you reach the island, rest.",
  tip: "Keep breathing while you hold. A bit lower is fine if you get tired." };
G.moon = { unit: "",
  goal: "Keep your lantern next to the moon. The moon moves up and down slowly.",
  ready: "Sit up tall at a table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Lift or lower your arm</b> to move the lantern.", "Keep the dot on the bar <b>in the green</b>.", "The lantern glows when you are right.", "Keep going until the time is up."],
  tip: "Move slowly. Watch the little stars to see where the moon goes next." };
G.stir = { unit: "circle",
  goal: "Stir the soup in big circles. Each circle adds a vegetable!",
  ready: "Sit at a table.",
  steps: ["Hold the phone <b>standing up</b> in your fist, like a spoon.", "<b>Tip it out</b> until the dot reaches the ring.", "<b>Stir all the way round</b> the way the arrow points.", "Keep stirring in big circles.", "When the arrow turns around, <b>stir the other way</b>."],
  rep: "One full circle.",
  tip: "Big, slow circles. Keep your wrist firm." };
G.fruit = { unit: "fruit|fruit",
  goal: "Catch the falling fruit in your basket!",
  ready: "Sit up tall. Face the screen.",
  steps: ["Hold the phone like a torch. <b>Point it at the screen.</b>", "Look for the next fruit. Its <b>shadow</b> shows where it lands.", "<b>Move your arm left or right</b> to move the basket.", "Get under the fruit <b>before it lands</b>.", "Then get ready for the next one."],
  rep: "Each fruit that falls, caught or missed.",
  tip: "Small moves are enough. Get there early." };
G.quickreach = { unit: "reach|reaches",
  goal: "Bop the moles! When a mole pops up, reach toward it fast.",
  ready: "Sit up tall. Face the screen.",
  steps: ["Hold the phone like a torch. <b>Point at the middle</b> of the screen.", "<b>Wait.</b> Keep still.", "A mole pops up. <b>Reach toward it fast!</b>", "<b>Come back to the middle.</b>", "Wait for the next mole."],
  rep: "Reach to a mole, then back to the middle.",
  tip: "Wait for the mole. Don't guess." };
G.reachturn = { unit: "door",
  goal: "Reach up to the door handle. Then turn your hand to open the door. A friend waves hello!",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Step 1: lift your arm</b> up to the handle.", "<b>Step 2: turn your hand over</b>, palm up. The door opens.", "The numbers on the screen show which step you are on.", "<b>Put your arm back down</b> on the table."],
  rep: "Reach up, turn, back down.",
  tip: "Do the reach first. Then turn." };
G.drawsword = { unit: "sword",
  goal: "Pull the sword out of the stone! Sweep your arm up and out to the side.",
  ready: "Sit up tall. Put your hand by your <b>other</b> hip.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Step 1: sweep your hand up</b> across your body.", "<b>Step 2: carry it out</b> to the side, up high.", "Hold it up like a sword.", "<b>Bring it back down</b> to your other hip."],
  rep: "Up, out to the side, back to your hip.",
  tip: "Watch your hand as it moves." };
G.bowling = { unit: "bowl",
  goal: "Roll the ball and stop it on the green mat. Knock down the pins!",
  ready: "Sit or stand. Put the wrist strap on.",
  steps: ["Hold the phone tight. <b>Do not let go.</b>", "Look at the green mat. Near? Swing softly. Far? Swing harder.", "<b>Swing your arm back.</b>", "<b>Swing it forward</b>, like bowling a ball.", "See where it stops. Change your next swing."],
  rep: "Every swing is one bowl.",
  tip: "Hold on tight. Swing smooth, don't throw." };
G.spotlight = { unit: "bow",
  goal: "Shine the spotlight on the monkey. Hold it there while the monkey takes a bow!",
  ready: "Sit up tall at a table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "See how high the monkey is on the rope.", "<b>Lift or lower your arm</b> to move the light onto it.", "<b>Hold very still</b> while it bows.", "The monkey climbs to a new place. Find it again."],
  rep: "Light up the monkey until it bows.",
  tip: "When you are close, make tiny moves." };

// ---------------------------------------------------------------- Wrist & forearm
G.pour = { unit: "cup",
  goal: "Pour the tea! Fill each cup up to the green line.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Turn your hand slowly</b>, like tipping a teapot.", "The tea pours into the cup.", "<b>Stop at the green line.</b>", "<b>Turn your hand back.</b> A new cup comes."],
  rep: "Fill one cup and turn back.",
  tip: "Pour slowly, or the tea splashes!" };
G.lock = { unit: "code",
  goal: "Open the safe! Remember the numbers. Then turn your wrist to dial each one.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Read the numbers</b> on the note. Remember them.", "<b>Turn your wrist</b> to move the pointer to the first number.", "<b>Hold still</b> on the number to put it in.", "Do the next number. Get them all and the safe opens!"],
  rep: "One whole code.",
  tip: "Say the numbers out loud. It helps you remember." };
G.maze = { unit: "maze|mazes",
  goal: "Tip your hand to roll the ball through the maze to the flag.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Tip the front down</b> to roll the ball forward.", "<b>Tip it up</b> to roll the ball back.", "<b>Turn your hand</b> left or right to roll it sideways.", "Hold the phone flat to stop. Get to the flag!"],
  rep: "Roll the ball from the start to the flag.",
  tip: "Small tips are enough. Try not to bump the walls." };
G.wristbend = { unit: "strike",
  goal: "Ring the gong! Bend your wrist up, then down. The fish jump!",
  ready: "Rest your arm on the table. Your hand hangs over the edge, palm down.",
  steps: ["Hold the phone flat against your palm. <b>Screen down.</b>", "<b>Bend your wrist up.</b>", "<b>Bend your wrist down.</b> That rings the gong.", "Keep going: up, then down.", "The box at the top shows which way is next."],
  rep: "Wrist up, then down.",
  tip: "Keep your arm on the table. Only your hand moves." };
G.wiper = { unit: "wipe",
  goal: "Clear the rain off the car window. Move your hand side to side, like a wiper.",
  ready: "Rest your arm on the table. Put your hand on top of the phone.",
  steps: ["Hold the phone under your palm. <b>Screen down.</b>", "<b>Slide your hand</b> to one side.", "Stop in the green and <b>hold</b> a moment.", "<b>Slide your hand</b> to the other side.", "Keep going, side to side."],
  rep: "One wipe to each side.",
  tip: "Your arm stays still. Only your hand slides." };
G.steady = { unit: "",
  goal: "Carry the lemonade without spilling! Keep your hand flat and still.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Put the phone <b>flat on your open hand</b>. Screen up.", "<b>Hold your hand flat</b>, like carrying a tray.", "Keep the bubble <b>inside the green circle</b>.", "The circle gets smaller. Stay steady!", "Keep going until the time is up."],
  tip: "Relax your shoulders. Breathe slowly." };
G.key = { unit: "turn",
  goal: "Turn the key to open the treasure chest!",
  ready: "Sit at a table. Rest your arm on the table, thumb on top.",
  steps: ["Hold the phone flat in your fist. <b>Thumb on top.</b>", "<b>Turn your hand over</b>, like turning a key.", "Turn until your <b>palm faces up</b>, if you can.", "<b>Hold it</b> while the chest opens.", "<b>Turn it back.</b> The lid closes."],
  rep: "Turn, hold, turn back.",
  tip: "Keep your elbow still on the table." };
G.drawbridge = { unit: "lift",
  goal: "Lift your hand to raise the bridge. Hold it up while the boat goes under!",
  ready: "Rest your arm on the table. Your hand hangs over the edge, palm down.",
  steps: ["Hold the phone flat against your palm. <b>Screen down.</b>", "<b>Lift your hand up</b> at the wrist.", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Let your hand relax</b> down. Rest."],
  rep: "Lift, hold until the boat is through, relax.",
  tip: "Lift from the wrist. Keep your arm on the table." };
G.wheel = { unit: "arch|arches",
  goal: "Drive the little red car! Steer through the green arches.",
  ready: "Sit up tall. Hold the phone with <b>both hands</b>, standing up tall.",
  steps: ["Hold the phone like a <b>steering wheel</b>. Screen facing you.", "Look for the road with the <b>green arch</b>.", "<b>Turn the phone</b> to steer into that road.", "Get there early.", "<b>Hold steady</b> as you drive through."],
  rep: "Drive under one green arch.",
  tip: "Turn with both hands together." };
G.wristcircle = { unit: "circle",
  goal: "Turn the merry-go-round! Make circles with your hand.",
  ready: "Rest your arm on the table. Your hand hangs over the edge, palm down.",
  steps: ["Hold the phone flat against your palm. <b>Screen down.</b>", "<b>Tip your hand</b> until the dot reaches the ring.", "<b>Circle all the way round</b> the way the arrow points.", "Keep making slow circles.", "When the arrow turns around, <b>circle the other way</b>."],
  rep: "One full circle.",
  tip: "Big, slow circles. Keep your arm still." };
G.water = { unit: "plant",
  goal: "Water the plants! Turn to the plant, then tip the can. The plant grows!",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Step 1: turn your hand</b> toward the plant.", "<b>Step 2: tip the front down</b> to pour.", "<b>Hold it</b> while the water pours.", "<b>Come back to the middle</b> for the next plant."],
  rep: "Turn, pour, back to the middle.",
  tip: "Do one step at a time. The numbers show which step." };
G.jar = { unit: "twist|twists",
  goal: "Open the cookie jar! Twist the lid back and forth until it pops off.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Twist your hand</b> one way.", "<b>Twist it back</b> the other way.", "Keep twisting back and forth.", "The lid gets looser each time!"],
  rep: "One twist each way.",
  tip: "Keep your elbow still. Twist from your arm." };
G.scoophold = { unit: "scoop",
  goal: "Scoop the ice cream! Bend your wrist down and hold it.",
  ready: "Rest your arm on the table. Your hand hangs over the edge, palm down.",
  steps: ["Hold the phone flat against your palm. <b>Screen down.</b>", "<b>Bend your wrist down.</b>", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Bring your hand back up</b> and rest."],
  rep: "Bend down, hold, back up.",
  tip: "Only your hand moves. Your arm stays on the table." };
G.fill = { unit: "glass|glasses",
  goal: "Pour the lemonade! Tip the jug and fill the glass to the line.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone <b>standing up</b> in your fist, like a jug.", "<b>Tip it to the side.</b> Lemonade pours.", "Keep the dot in the <b>green band</b>.", "<b>Hold it steady</b> until the glass is full.", "<b>Stand it back up.</b> A new glass comes."],
  rep: "Fill one glass.",
  tip: "Tip too far and it stops pouring. Small moves." };
G.soup = { unit: "spoonful",
  goal: "Eat your soup! Scoop with the spoon, then lift it to your mouth.",
  ready: "Sit at a table.",
  steps: ["Hold the phone flat in your fist, <b>like a spoon</b>.", "<b>Step 1: turn your hand</b> to scoop the soup.", "<b>Step 2: lift the spoon</b> up to your mouth.", "<b>Put it back down</b> to the bowl.", "Scoop again!"],
  rep: "Scoop, lift, back down.",
  tip: "Sit back in the chair. Bring the spoon to you." };
G.sail = { unit: "",
  goal: "Sail the boat between the buoys. Turn your hand to steer.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Turn your hand</b> left or right to steer.", "Keep the dot on the bar <b>in the green</b>.", "Look ahead to see where to go.", "Keep sailing until the time is up."],
  tip: "Slow, smooth turns work best." };

// ---------------------------------------------------------------- Hand & fingers
G.tap = { unit: "",
  goal: "Tap the light as fast as you can!",
  ready: "Put your hand next to the phone or the screen.",
  steps: ["Find the <b>lit lane</b>.", "<b>Tap it</b> with your weaker hand.", "Tap again and again, <b>fast</b>!", "On harder levels the light moves. Follow it.", "Keep going until the time is up."],
  tip: "Keep your wrist down. Tap with your finger." };
G.rhythm = { unit: "note",
  goal: "Play the music! Tap each note when it reaches the green line.",
  ready: "Put one finger over each lane.",
  steps: ["<b>Watch the notes</b> fall down.", "A note reaches the <b>green line</b>.", "<b>Tap its lane</b> right then.", "Use the finger over that lane.", "Get ready for the next note."],
  rep: "Each note, hit or missed.",
  tip: "Watch the green line, not the top." };
G.dial = { unit: "number",
  goal: "Type the phone number you see.",
  ready: "Use the number keys on your phone or on the screen.",
  steps: ["<b>Read the number.</b> Say it out loud.", "<b>Type it</b> on the keys with your weaker hand.", "Made a mistake? Tap <b>←</b> to fix it.", "On level 3 the number hides after 3 seconds.", "Then do the next number."],
  tip: "Read it in small parts, like 555 · 12 · 34." };
G.pinch = { unit: "item",
  goal: "Pick up the small things and put them in the green box.",
  ready: "Use the touch screen or trackpad with your weaker hand.",
  steps: ["<b>Press on a thing</b> and keep your finger down.", "<b>Slide it</b> to the green box.", "<b>Let go</b> inside the box.", "Do the next one.", "Harder levels have smaller things."],
  rep: "One thing in the box.",
  tip: "Go slowly. Careful is better than fast." };
G.grip = { unit: "squeeze|squeezes",
  goal: "Squeeze a soft ball hard. Then open your hand wide.",
  ready: "Get a soft ball or a rolled-up towel. Rest your arm on the table.",
  steps: ["Hold the ball in your weaker hand.", "<b>Squeeze it hard.</b> Count: 1, 2, 3.", "<b>Let go.</b> Open your fingers wide.", "Press <b>Done</b> (on the phone, the screen, or the space bar).", "Do it again."],
  rep: "Squeeze, open wide, press Done.",
  tip: "Open your fingers all the way." };
G.putty = { unit: "squeeze|squeezes",
  goal: "Squeeze the putty in your hand. Then roll it back into a ball.",
  ready: "Get therapy putty or play dough. Sit at a table.",
  steps: ["Hold the putty in your weaker hand.", "<b>Squeeze it</b> as hard as is OK.", "<b>Roll it</b> back into a ball.", "Press <b>Done</b>.", "Do it again."],
  rep: "Squeeze, roll, press Done.",
  tip: "Use all your fingers. Stop if your hand cramps." };
G.curls = { unit: "curl",
  goal: "Bend your fingers into a hook. Then make them straight.",
  ready: "Rest your arm on the table, palm up.",
  steps: ["Keep your <b>big knuckles</b> straight.", "<b>Bend your fingers</b> into a hook.", "<b>Straighten them</b> all the way.", "Press <b>Done</b>.", "Do it again."],
  rep: "Hook, straighten, press Done.",
  tip: "Go slowly. Your other hand can help." };
G.thumbs = { unit: "round",
  goal: "Touch your thumb to each fingertip, one by one.",
  ready: "Hold your weaker hand up. Palm facing you.",
  steps: ["Thumb touches your <b>pointer finger</b>.", "Thumb touches your <b>middle finger</b>.", "Thumb touches your <b>ring finger</b>.", "Thumb touches your <b>little finger</b>.", "Press <b>Done</b>. Start again."],
  rep: "Thumb to all four fingers, then press Done.",
  tip: "Make a round 'O' shape each time." };
G.clothespin = { unit: "",
  goal: "Squeeze clothespins open and clip them onto a box.",
  ready: "Put a box or cup and some clothespins on the table.",
  steps: ["Pick up a clothespin with your weaker hand.", "<b>Squeeze it open.</b>", "<b>Clip it</b> on the edge of the box.", "When all are on, <b>take them off</b>.", "Keep going until the time is up."],
  tip: "Use your fingertips, not your whole hand." };
G.coins = { unit: "",
  goal: "Pick up coins one at a time. Drop them in a cup.",
  ready: "Put some coins on the table next to a cup.",
  steps: ["<b>Pick up one coin</b> with your weaker hand.", "<b>Drop it</b> in the cup.", "Do the next coin.", "When all are in, tip them out.", "Keep going until the time is up."],
  tip: "Hard to pick up? Slide the coin to the table edge first." };
G.buttons = { unit: "",
  goal: "Practise getting dressed. Undo the buttons, then do them up.",
  ready: "Put a shirt with buttons on the table, or wear one.",
  steps: ["<b>Undo a button</b> with both hands.", "Undo all the buttons.", "<b>Do them up</b> again.", "Use your weaker hand as much as you can.", "Keep going until the time is up."],
  tip: "Start with the biggest buttons." };
G.knifefork = { unit: "",
  goal: "Practise cutting food with a knife and fork.",
  ready: "Put play dough or soft food on a plate. Get a knife and fork.",
  steps: ["Hold the <b>fork</b> in one hand.", "Hold the <b>knife</b> in the other hand.", "Hold the food still with the fork.", "<b>Cut small pieces</b> with the knife.", "Swap hands if you can. Keep going until the time is up."],
  tip: "Put your pointer finger on top of the knife." };
G.mole = { unit: "mole",
  goal: "Whack the mole! Tap where it pops up, fast.",
  ready: "Put your hand by the keys on the phone or the screen.",
  steps: ["<b>Watch the holes.</b>", "A mole pops up.", "<b>Tap that hole</b> fast!", "Get ready for the next one.", "On harder levels, moles hide faster."],
  rep: "Each mole, hit or missed.",
  tip: "Rest your hand in the middle. Every hole is close." };
G.scales = { unit: "pattern",
  goal: "Play the piano! Tap the fingers in order.",
  ready: "Put one finger over each lane. Pointer finger on lane 1.",
  steps: ["<b>Read the numbers.</b> 1 is your pointer finger.", "4 is your little finger.", "<b>Tap the lanes</b> in that order.", "One finger at a time.", "Then a new pattern comes."],
  rep: "One whole pattern.",
  tip: "Keep the other fingers still." };
G.drum = { unit: "",
  goal: "Play a drum roll! Tap two fingers, one then the other, fast.",
  ready: "Put two fingers over the two lit lanes.",
  steps: ["<b>Tap one lane.</b>", "<b>Tap the other lane.</b>", "Go back and forth.", "<b>Faster and faster!</b>", "Keep going until the time is up."],
  tip: "Even taps are better than messy fast ones." };
G.beat = { unit: "beat",
  goal: "Tap along with the music beat.",
  ready: "Turn the sound on. Put your finger over the button.",
  steps: ["<b>Listen</b> to the beat.", "Nod along to it.", "<b>Tap the button</b> on each beat.", "Stay in time.", "Keep going until it stops."],
  tip: "Nod your head to the beat. Tap with the nod." };
G.numhunt = { unit: "round",
  goal: "Find the numbers 1 to 9 and tap them in order.",
  ready: "Use the number keys on your phone or on the screen.",
  steps: ["<b>Find 1.</b> Tap it.", "<b>Find 2.</b> Tap it.", "Keep going: 3, 4, 5…", "Finish with <b>9</b>.", "The keys mix up for the next round."],
  rep: "Tap 1 to 9 in order.",
  tip: "Look across all the keys before you tap." };
G.typeword = { unit: "word",
  goal: "Type the word on the letter keys.",
  ready: "Use the letter keys on your phone or on the screen.",
  steps: ["<b>Read the word.</b> Say it out loud.", "<b>Tap the first letter.</b>", "Tap the next letters in order.", "Made a mistake? Tap <b>←</b> to fix it.", "Then a new word comes."],
  tip: "Say each letter as you tap it." };
G.tapcount = { unit: "round",
  goal: "Tap the button exactly the number of times shown.",
  ready: "Put your finger over the button on the phone or the screen.",
  steps: ["<b>Read the number.</b>", "<b>Tap that many times.</b>", "Count out loud: 1, 2, 3…", "Then <b>stop and wait</b>.", "It checks your count."],
  rep: "Tap one number's worth.",
  tip: "Go slowly and count each tap." };
G.pegboard = { unit: "peg",
  goal: "Put every peg in a hole, as fast as you can.",
  ready: "Use the touch screen or trackpad with your weaker hand.",
  steps: ["<b>Press on a peg</b> and keep your finger down.", "<b>Slide it</b> to an empty hole.", "<b>Let go</b> right over the hole.", "Do the next peg.", "Fill all the holes!"],
  rep: "One peg in a hole.",
  tip: "Slow down near the hole." };
G.shake = { unit: "shake",
  goal: "Shake the snow globe! Each shake builds a little snowy village.",
  ready: "Sit up tall. Put the wrist strap on.",
  steps: ["Hold the phone <b>tight</b> in your fist.", "<b>Shake it up and down.</b> Short, quick shakes.", "Watch the snow swirl.", "Keep shaking!", "Stop when the village is finished."],
  rep: "Each shake.",
  tip: "Hold on tight. Shake from your elbow." };
G.pengrip = { unit: "drawing",
  goal: "Hold the phone like a pen and draw the picture.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone <b>standing up</b>, like a big pen.", "<b>Tip it</b> to move the pencil.", "Go to the <b>orange dot</b>. That is the start.", "<b>Follow the dotted line</b> slowly.", "Get to the end. Your drawing goes on the wall!"],
  rep: "From the orange dot to the end of the line.",
  tip: "Hold it with your fingertips, like a pen." };

// ---------------------------------------------------------------- Trunk & legs
G.lean = { unit: "lean",
  goal: "Feed the ducks! Lean toward the duck with the ring.",
  ready: "Sit on a firm chair. Feet flat on the floor.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "Find the duck with the <b>ring</b>: left, right or in front.", "<b>Lean your body</b> toward it.", "<b>Hold</b> while the duck eats.", "<b>Sit back up</b> in the middle."],
  rep: "Lean, hold, sit back up.",
  tip: "Keep your feet flat. Lean from your hips." };
G.twist = { unit: "animal",
  goal: "Look around and find the hidden animals!",
  ready: "Sit up tall on a chair without wheels. Feet flat.",
  steps: ["<b>Pick a world</b> from the list below.", "Hold the phone <b>flat on your chest</b>.", "<b>Turn your shoulders</b> to look left and right.", "See the animal? <b>Hold still</b> on it.", "Now find the next animal."],
  rep: "Each animal you find.",
  tip: "Keep your hips and knees facing forward." };
G.sit2stand = { unit: "stand",
  goal: "Stand up from your chair, then sit down. You can see the balloons over the hedge!",
  ready: "Use a strong chair with arms, against a wall. Have someone near you.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Move forward</b> in the chair. Feet back.", "Lean forward. <b>Stand up</b> all the way.", "<b>Sit down slowly.</b> Reach back for the chair.", "Rest. Then do it again."],
  rep: "Stand up and sit back down.",
  tip: "Nose over toes as you stand. Sit down slowly." };
G.balance = { unit: "",
  goal: "Stand tall and very still. Build a tall tower of blocks!",
  ready: "Stand at a counter you can hold. Have someone near you.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "Level 1: feet apart. Level 2: feet together.", "Level 3: one foot in front of the other.", "<b>Stand very still.</b> Keep the dot in the green circle.", "Keep going until the time is up."],
  tip: "Look at one spot in front of you. Breathe slowly." };
G.march = { unit: "step",
  goal: "Lead the animal parade! March in your chair.",
  ready: "Sit up tall near the front of the chair. Feet flat.",
  steps: ["Put the phone in your <b>front pocket</b>.", "<b>Lift one knee</b> up.", "Put it down.", "<b>Lift the other knee</b> up.", "Keep marching!"],
  rep: "Each knee lift.",
  tip: "Sit up tall. Don't lean back." };
G.heelraise = { unit: "raise",
  goal: "Lift your heels up off the floor. Then put them down.",
  ready: "Sit with feet flat. Or stand and hold a counter.",
  steps: ["<b>Lift both heels up.</b> Stay on your toes.", "<b>Hold.</b> Count: 1, 2.", "<b>Put your heels down</b> slowly.", "Press <b>Done</b>.", "Do it again."],
  rep: "Up, hold, down, press Done.",
  tip: "Go straight up and down." };
G.anklepump = { unit: "pump",
  goal: "Pump your feet. Toes up, then toes down.",
  ready: "Sit with your feet on the floor.",
  steps: ["<b>Pull your toes up</b> toward you.", "<b>Push your toes down</b>, away from you.", "Press <b>Done</b>.", "Do it again.", "Keep a steady beat."],
  rep: "Toes up, toes down, press Done.",
  tip: "Go slowly. Go as far as feels OK." };
G.floor = { unit: "egg",
  goal: "Pick up the eggs! Lean down toward the floor to reach the nest.",
  ready: "Sit near the front of a strong chair. Feet flat and apart.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lean forward</b> and reach down to your feet.", "<b>Hold</b> while you pick up the egg.", "<b>Sit back up</b> tall.", "The hen lays a new egg."],
  rep: "Reach down, hold, sit up.",
  tip: "Keep your feet flat. Hold the chair if you feel wobbly." };
G.sidereach = { unit: "apple",
  goal: "Pick the apples! Reach out to the side to the shiny apple.",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Reach out to the side</b>. Lean your body with it.", "<b>Hold</b> while you pick the apple.", "<b>Sit back up</b> in the middle.", "Find the next apple."],
  rep: "Reach out, hold, sit up.",
  tip: "Keep both feet flat on the floor." };
G.rock = { unit: "stroke",
  goal: "Row the boat! Lean forward, then lean back.",
  ready: "Sit on a firm chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lean forward.</b>", "<b>Lean back</b> a little past sitting straight.", "Keep rowing: forward, back.", "Nice and slow."],
  rep: "One lean forward and one back.",
  tip: "Keep your back straight. Move from your hips." };
G.trunkcircle = { unit: "circle",
  goal: "Help the panda spin the hula hoop! Move your body in a circle.",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lean out</b> until the dot reaches the ring.", "<b>Circle your body</b> the way the arrow points.", "Forward, side, back, side.", "When the arrow turns around, <b>circle the other way</b>."],
  rep: "One full circle.",
  tip: "Slow circles. Stay sitting on the chair." };
G.kneeext = { unit: "kick",
  goal: "Straighten your leg to lift your foot. The ball flies into the net!",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Put the phone on your <b>shin</b>, below the knee.", "<b>Straighten your knee.</b> Your foot lifts up.", HOLD, "<b>Put your foot down</b> slowly.", "Rest. Then do it again."],
  rep: "Lift, hold, down.",
  tip: "Pull your toes up toward you." };
G.kneeout = { unit: "opening",
  goal: "Open the butterfly's wings! Move your knee out to the side.",
  ready: "Sit up tall. Feet flat on the floor.",
  steps: ["Put the phone <b>flat on your thigh</b>, near the knee.", "<b>Move your knee out</b> to the side.", "Keep your foot on the floor.", "<b>Hold</b> while the wings are open.", "<b>Bring your knee back</b> to the middle."],
  rep: "Knee out, hold, back in.",
  tip: "Keep your back still." };
G.foottilt = { unit: "lift",
  goal: "Lift your toes to lift the marble run. The marble rolls into the jar!",
  ready: "Sit with your foot flat on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Lift your toes up.</b> Keep your heel down.", HOLD, "<b>Put your foot down</b> slowly.", "Rest. Then do it again."],
  rep: "Toes up, hold, down.",
  tip: "Your heel stays on the floor." };
G.ankletrace = { unit: "shape",
  goal: "Walk the crab along the shells! Tip your foot to move it.",
  ready: "Sit with your heel on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Tip your foot</b> to move the crab to the orange dot.", "Tip up, down and to the sides to <b>follow the line</b>.", "Get to the end of the shape.", "A wave washes it away. Here is a new one!"],
  rep: "From the orange dot to the end.",
  tip: "Only your ankle moves. Heel stays down." };
G.toetap = { unit: "tap",
  goal: "Play the big drum! Tap your foot forward.",
  ready: "Sit up tall. Feet flat on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Tap your foot</b> forward on the floor.", "<b>Bring it back.</b>", "Do it again.", "Keep a steady beat."],
  rep: "Each tap.",
  tip: "Lift your foot up off the floor each time." };
G.bridge = { unit: "bridge|bridges",
  goal: "Lift your hips. The bridge comes up and an animal walks across!",
  ready: "Lie on your back on a bed or mat. Knees bent. Feet flat.",
  steps: ["Put the phone <b>flat on your thigh</b>.", "Squeeze your bottom.", "<b>Lift your hips up.</b>", "<b>Hold</b> while the animal walks across.", "<b>Lower down</b> slowly."],
  rep: "Lift, hold, down.",
  tip: "Push through your heels. Keep your head down." };
G.standshift = { unit: "shift|shifts",
  goal: "Help the penguin walk home! Move your weight from foot to foot.",
  ready: "Stand at a counter you can hold. Have someone near you.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "Stand with feet apart.", "<b>Move your weight</b> onto one foot.", "<b>Move your weight</b> onto the other foot.", "Keep both feet on the floor."],
  rep: "One shift to the side.",
  tip: "Stand tall. Move your hips, not your shoulders." };
G.minisquat = { unit: "squat",
  goal: "Help the frog jump! Bend your knees a little and hold.",
  ready: "Stand at a counter you can hold. Chair behind you. Someone near you.",
  steps: ["Put the phone in your <b>front pocket</b>.", "<b>Bend your knees a little</b>, like starting to sit.", "<b>Hold</b> while the frog gets ready.", "<b>Stand up tall.</b> The frog jumps!", "Rest. Then do it again."],
  rep: "Bend, hold, stand tall.",
  tip: "Only a small bend. Heels stay down." };
G.leanhold = { unit: "cake",
  goal: "Blow out the birthday candles! Lean forward and hold.",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lean forward</b> until the dot is in the green band.", HOLDBAND, "The candles go out one by one.", "<b>Sit back up</b> and rest."],
  rep: "Lean, hold until the candles are out, sit up.",
  tip: "Nose toward your toes. Keep your back straight." };
G.crossreach = { unit: "turn",
  goal: "Feed the farm animals! Turn your body to the side.",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Turn your shoulders</b> to the side.", "Face the animal that is waiting.", "<b>Hold</b> while it eats.", "<b>Turn back</b> to the front."],
  rep: "Turn, hold, back to the front.",
  tip: "Keep your hips and knees facing forward." };
G.neckturn = { unit: "photo",
  goal: "Take photos of the birds! Turn your head to the bird that sings.",
  ready: "Sit up tall.",
  steps: ["Hold the phone <b>flat on top of your head</b>.", "Find the <b>singing bird</b>.", "<b>Turn your head</b> slowly toward it.", "Snap! You took its photo.", "<b>Turn slowly</b> to the other side."],
  rep: "One photo on each side.",
  tip: "Turn only as far as feels OK." };
G.nod = { unit: "nod",
  goal: "Say hello to the owl and the fish! Look up, then look down.",
  ready: "Sit up tall.",
  steps: ["Hold the phone <b>flat on top of your head</b>.", "<b>Look down</b> at the fish. Chin to chest.", "<b>Look up</b> at the owl.", "Keep nodding slowly.", "Down, then up."],
  rep: "One nod down and up.",
  tip: "Go slowly. Stop if you feel dizzy." };
G.gaze = { unit: "turn",
  goal: "Keep your eyes on the gold star while you turn your head.",
  ready: "Sit up tall, an arm's length from the screen.",
  steps: ["Hold the phone <b>flat on top of your head</b>.", "<b>Look at the gold star</b> on the screen.", "<b>Turn your head</b> a little to one side.", "Keep your eyes on the star!", "Turn to the other side."],
  rep: "Each turn of your head.",
  tip: "Small, slow turns. Is the star blurry? Slow down." };
G.eartilt = { unit: "tip",
  goal: "Keep the ball on the board! When the picture tips, tip your head the other way.",
  ready: "Sit up tall.",
  steps: ["Hold the phone <b>flat on top of your head</b>.", "Watch the picture <b>tip</b>.", "<b>Tip your head</b> the other way. Ear toward shoulder.", "Make the picture <b>flat</b> again.", "<b>Hold it</b> so the ball stays on."],
  rep: "Make it flat and hold.",
  tip: "Keep your shoulders down." };
G.sidebendhold = { unit: "hold",
  goal: "Sail to the lighthouse! Lean to the side and hold.",
  ready: "Sit up tall in a strong chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lean your body</b> to the side.", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Sit back up</b> straight and rest."],
  rep: "Lean, hold, sit up.",
  tip: "Lean to the side, not forward." };
G.kneelift = { unit: "lift",
  goal: "Fly the hot-air balloon! Lift your knee and hold it up.",
  ready: "Sit up tall in a strong chair. Both feet flat.",
  steps: ["Put the phone <b>flat on your thigh</b>, near the knee.", "<b>Lift your knee</b> up.", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Put your foot down</b> and rest."],
  rep: "Lift, hold until you reach the flag, down.",
  tip: "Sit up tall. Don't lean back." };
G.penalty = { unit: "kick",
  goal: "Kick the ball into the little goal! A harder kick goes further.",
  ready: "Sit up tall. Feet on the floor.",
  steps: ["Put the phone on your <b>shin</b>, below the knee.", "Look at the goal. Near? Kick softly. Far? Kick harder.", "<b>Kick your foot forward.</b>", "<b>Put your foot down.</b>", "See where it goes. Change your next kick."],
  rep: "Every kick counts.",
  tip: "Kick by straightening your knee." };
G.anklecircles = { unit: "circle",
  goal: "Spin the pottery wheel! Draw circles with your toes.",
  ready: "Sit with your heel on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Tip your foot</b> until the dot reaches the ring.", "<b>Draw a circle</b> with your toes, the way the arrow points.", "Keep making circles.", "When the arrow turns around, <b>go the other way</b>."],
  rep: "One full circle.",
  tip: "Big circles from your ankle. Your leg stays still." };
G.anklerock = { unit: "rock",
  goal: "Rock the baby's cradle! Roll your foot side to side.",
  ready: "Sit with your foot flat on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Roll your foot</b> onto its outside edge.", "<b>Roll it</b> onto its inside edge.", "Keep rocking gently.", "Side to side."],
  rep: "One roll each way.",
  tip: "Only your ankle moves. Your knee stays still." };
G.gaspedal = { unit: "speed",
  goal: "Drive at the right speed! Press your foot like a car pedal.",
  ready: "Sit with your heel on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Read the speed</b> on the sign.", "<b>Push your toes down</b> to go faster.", "<b>Lift your toes</b> to go slower.", "Get the needle in the green. <b>Hold steady.</b>"],
  rep: "Match one speed and hold.",
  tip: "Tiny moves. Your heel stays down." };
G.cycling = { unit: "pedal",
  goal: "Ride your bike through the park! Move your legs like pedalling.",
  ready: "Sit up tall. Use a pedal machine, or keep feet on the floor.",
  steps: ["Put the phone <b>flat on your thigh</b>, near the knee.", "<b>Push your leg</b> forward and down.", "<b>Bring it back</b> up.", "Keep pedalling round and round.", "Ride to the finish!"],
  rep: "One push and one pull back.",
  tip: "Keep a steady speed." };
G.sidelegs = { unit: "lift",
  goal: "Lift the gate for the little cars! Lift your top leg up.",
  ready: "Lie on your side on a bed or mat. Weaker leg on top. Bottom knee bent.",
  steps: ["Put the phone <b>flat on your top thigh</b>, near the knee.", "<b>Lift your top leg up.</b> Keep it straight.", "<b>Hold</b> while the car drives through.", "<b>Lower it down</b> slowly.", "Rest. Then do it again."],
  rep: "Lift, hold, down.",
  tip: "Toes point forward, not up." };
G.kneerolls = { unit: "roll",
  goal: "Paint a rainbow! Roll your knees from side to side.",
  ready: "Lie on your back on a bed or mat. Knees bent and together.",
  steps: ["Put the phone <b>flat on your thigh</b>.", "<b>Let both knees roll</b> to one side.", "<b>Bring them back</b> over to the other side.", "Keep rolling slowly.", "Each roll paints more of the rainbow."],
  rep: "One roll there and back.",
  tip: "Keep your shoulders flat on the bed." };
G.slalom = { unit: "gate",
  goal: "Ski down the mountain! Move your weight left and right to steer.",
  ready: "Stand at a counter you can hold. Have someone near you.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "Look at the next <b>flag gate</b>.", "<b>Move your weight</b> left or right to steer.", "Line up with the gate early.", "<b>Hold steady</b> as you ski through."],
  rep: "Each gate.",
  tip: "Keep both feet on the floor." };
G.heeltoe = { unit: "rock",
  goal: "Ride the seesaw! Rock your foot up and down.",
  ready: "Sit with your foot flat on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Lift your toes.</b> Rock back on your heel.", "<b>Lift your heel.</b> Rock forward on your toes.", "Keep rocking.", "Slow and steady."],
  rep: "One rock each way.",
  tip: "Go all the way each way, slowly." };
G.chestup = { unit: "lift",
  goal: "Wake up the sunflower! Sit up tall and lift your chest.",
  ready: "Sit near the front of the chair. Feet flat.",
  steps: ["Hold the phone <b>flat on your chest</b>.", "<b>Lift your chest up.</b> Lean back a little.", "<b>Hold</b> it tall while the bees come.", "<b>Relax</b> forward.", "Rest. Then do it again."],
  rep: "Lift, hold, relax.",
  tip: "Squeeze your shoulder blades together gently." };
G.toeshold = { unit: "fish|fish",
  goal: "Catch a fish! Lift your toes and hold to reel it in.",
  ready: "Sit with your heel on the floor.",
  steps: ["Put the phone <b>on top of your foot</b>.", "<b>Lift your toes up</b> toward you.", "Stop when the dot is in the <b>green band</b>.", HOLDBAND, "<b>Put your foot down</b> and rest."],
  rep: "Lift, hold until the fish is in, down.",
  tip: "Heel stays down. Lift from your ankle." };

// ---------------------------------------------------------------- Therapy sessions
G.mirror = { unit: "",
  goal: "Watch your strong arm in a mirror. It looks like your weaker arm is moving!",
  ready: "Put a mirror standing up on the table, between your arms.",
  steps: ["The mirror faces your <b>strong arm</b>.", "<b>Hide your weaker arm</b> behind the mirror.", "Do each move on the screen <b>with both arms</b>.", "<b>Look in the mirror</b> the whole time.", "Keep going until the time is up."],
  tip: "Pretend the arm in the mirror is your weaker arm." };
G.imagery = { unit: "",
  goal: "Practise in your mind. A voice helps you picture a move. Then you try it.",
  ready: "Sit somewhere quiet. Turn the sound on.",
  steps: ["<b>Close your eyes</b> if you like.", "<b>Listen</b> to the voice.", "<b>Picture the move</b> in your mind. See it and feel it.", "<b>Try the move</b> when it asks.", "Press <b>Next step</b> to go on sooner."],
  tip: "Picture it as if you are really doing it." };

// ---------------------------------------------------------------- Visual scanning
G.cancel = { unit: "page",
  goal: "Find every star on the page and tap it.",
  ready: "Sit straight in front of the screen.",
  steps: ["<b>Start at the top left</b> corner.", "<b>Look across the row</b>, left to right.", "<b>Tap every star</b> you see.", "Do the next row. Then the next.", "Sure you found them all? Tap <b>I've found them all</b>."],
  tip: "Look at the left side twice." };
G.lookleft = { unit: "star",
  goal: "Find the star. Start looking on the left side.",
  ready: "Sit straight in front of the screen.",
  steps: ["Look at the <b>glowing bar</b> on the left first.", "<b>Move your eyes</b> slowly to the right.", "See the star? <b>Tap it!</b>", "Start on the left again.", "Find the next star."],
  tip: "Turn your head to the left, not just your eyes." };
G.bisect = { unit: "line",
  goal: "Tap the exact middle of each line.",
  ready: "Sit straight in front of the screen.",
  steps: ["Look at the <b>left end</b> of the line.", "Look at the <b>right end</b> of the line.", "<b>Tap the middle.</b>", "The green mark shows the real middle.", "Try the next line."],
  tip: "Find the left end first. It is easy to miss." };

// ---------------------------------------------------------------- Attention
G.quick = { unit: "catch|catches",
  goal: "How fast are you? Tap the moment the circle shows up!",
  ready: "Put your finger over the button on the phone or the screen.",
  steps: ["<b>Keep your finger ready.</b>", "<b>Watch</b> the screen.", "<b>Wait</b> for the circle.", "It shows up. <b>Tap fast!</b>", "Tapping too early does not count."],
  tip: "Stay relaxed. Wait for it." };
G.gonogo = { unit: "circle",
  goal: "Green means tap. Orange means wait!",
  ready: "Put your finger over the button on the phone or the screen.",
  steps: ["<b>Watch</b> the circle.", "Is it <b>green</b>? <b>Tap!</b>", "Is it <b>orange</b>? <b>Don't tap.</b>", "Let the orange one go away.", "Get ready for the next circle."],
  tip: "See the colour first. Then decide." };
G.watch = { unit: "",
  goal: "Keep watch at night. Tap only when you see a star.",
  ready: "Put your finger over the button on the phone or the screen.",
  steps: ["<b>Watch the middle</b> of the screen.", "Shapes come one at a time.", "Not a star? <b>Don't tap.</b>", "A star? <b>Tap!</b>", "Keep watching until the time is up."],
  tip: "Stars can come any time. Stay ready." };
G.twoatonce = { unit: "",
  goal: "Watch two things at once! Even numbers on the left. The lamp on the right.",
  ready: "Use the two keys on your phone, or the two sides of the screen.",
  steps: ["<b>Watch both sides</b> of the screen.", "Left side: an <b>even number</b> (2, 4, 6, 8)? <b>Tap left.</b>", "Right side: the <b>lamp lights up</b>? <b>Tap right.</b>", "Do nothing for anything else.", "Keep going until the time is up."],
  tip: "Look at the middle. You can see both sides." };
G.trail = { unit: "trail",
  goal: "Join the circles in order, like a dot-to-dot.",
  ready: "Tip the phone to move the pointer. Or use the mouse or touch screen.",
  steps: ["<b>Find circle 1.</b> Tap it.", "<b>Find circle 2.</b> Tap it.", "Keep going: 3, 4, 5…", "On level 3, go <b>1, A, 2, B, 3, C</b>…", "Join them all!"],
  rep: "One whole trail.",
  tip: "Say the next one out loud. Then look for it." };

// ---------------------------------------------------------------- Memory
G.simon = { unit: "pattern",
  goal: "The flowers ring in a pattern. Watch, then copy it by tipping your hand!",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Watch</b> the flowers ring. Don't move yet.", "<b>Tip your hand</b> toward the first flower.", "<b>Come back to flat.</b> Then tip to the next one.", "Copy the whole pattern!"],
  rep: "One whole pattern.",
  tip: "Say it out loud while you watch: up, left, up…" };
G.pairs = { unit: "game",
  goal: "Find the matching pairs! Turn over two cards at a time.",
  ready: "Tip the phone to move the pointer. Or use the mouse or touch screen.",
  steps: ["<b>Tap a card.</b> It turns over.", "<b>Tap another card.</b>", "Same picture? They stay up!", "Not the same? They turn back.", "<b>Remember</b> where each picture was."],
  rep: "Find all the pairs.",
  tip: "Go row by row. It helps you remember." };
G.nback = { unit: "letter",
  goal: "Is this letter the same as the one before?",
  ready: "Use the Same and Different keys on your phone or the screen.",
  steps: ["<b>Look at the letter.</b>", "Is it the <b>same</b> as the last letter? Tap <b>Same</b>.", "Is it <b>different</b>? Tap <b>Different</b>.", "On level 3, check the letter <b>two</b> before.", "Then the next letter comes."],
  tip: "Whisper each letter to yourself." };
G.span = { unit: "round",
  goal: "Remember the numbers and type them back.",
  ready: "Use the number keys on your phone or on the screen.",
  steps: ["<b>Watch the numbers</b> one at a time.", "Remember them.", "<b>Type them back</b> in the same order.", "Right? Next time there is one more number!", "Keep going."],
  tip: "Say them out loud, like a phone number." };
G.wordlist = { unit: "list",
  goal: "Remember the words. Then find them in a bigger list.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Read each word.</b> Say it out loud.", "Try to remember them all.", "Ready? Tap <b>I'm ready</b>.", "<b>Tap the words</b> you saw before.", "Tap <b>Done</b>."],
  rep: "One whole list.",
  tip: "Make a little story with the words." };
G.shopping = { unit: "list",
  goal: "Remember the shopping list. Then fill your basket!",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Read the shopping list.</b>", "Try to remember it all.", "Ready? Tap <b>I'm ready</b>.", "<b>Tap each thing</b> from your list on the shelves.", "Tap <b>Done</b>."],
  rep: "One whole list.",
  tip: "Picture yourself in the shop, picking each thing." };
G.faces = { unit: "",
  goal: "Learn some names. Then put the right name with each face.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Look at each face.</b>", "<b>Say the name</b> out loud.", "Ready? Tap <b>I'm ready</b>.", "Look at a face.", "<b>Tap the right name.</b>"],
  tip: "Link the name to something you see, like a red scarf." };

// ---------------------------------------------------------------- Reasoning
G.sort = { unit: "word",
  goal: "Sort the boxes at the market! Turn your hand to the right basket.",
  ready: "Sit at a table. Rest your arm on the table.",
  steps: ["Hold the phone flat in your fist. <b>Screen up.</b>", "<b>Read the word</b> on the box.", "<b>Read the two baskets.</b> Which one does it go in?", "<b>Turn your hand</b> toward that basket. Hold.", "<b>Come back to flat</b> for the next word."],
  rep: "Each word you sort.",
  tip: "Take your time to read before you turn." };
G.tower = { unit: "puzzle",
  goal: "Move all the rings to the peg on the right. Never put a big ring on a small one!",
  ready: "Tip the phone to move the pointer. Or use the mouse or touch screen.",
  steps: ["<b>Tap a peg.</b> You pick up its top ring.", "<b>Tap another peg.</b> You put the ring there.", "Only one ring at a time.", "A big ring can't go on a small one.", "Get them all on the <b>right peg</b>!"],
  rep: "Move the whole stack.",
  tip: "Think a few moves ahead." };
G.errands = { unit: "plan",
  goal: "Plan your day! Go to each place while it is open.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["You start at <b>9 o'clock</b>.", "Each job takes <b>one hour</b>.", "<b>Read when each place opens and closes.</b>", "<b>Tap the jobs</b> in the order you would do them.", "Check every place is open when you get there."],
  rep: "One whole day planned.",
  tip: "Go first to places that close early." };
G.next = { unit: "pattern",
  goal: "What comes next? Find the pattern!",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Look at the row.</b>", "What changes each time?", "<b>Find the rule.</b>", "What comes next?", "<b>Tap your answer.</b>"],
  tip: "Look at the change from one to the next." };
G.rotate = { unit: "pair",
  goal: "Is it the same shape turned around? Or a mirror picture?",
  ready: "Tip the phone to move the pointer. Or use the mouse or touch screen.",
  steps: ["<b>Look at both shapes.</b>", "<b>Picture turning</b> the left shape around.", "Does it match the right shape?", "Yes? Tap <b>Same shape</b>.", "No, it is flipped? Tap <b>Mirror image</b>."],
  tip: "Pick one corner. Follow where it goes." };
G.change = { unit: "sale",
  goal: "Pay with the right money!",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Read the price.</b>", "<b>Tap coins and notes</b> to add them up.", "Stop when it is <b>exactly</b> right.", "Too much? Tap <b>Undo</b>.", "On level 3, give the change back instead."],
  tip: "Start with the biggest money that fits." };
G.clock = { unit: "clock",
  goal: "What time is it? Read the clock.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["Look at the <b>short hand</b>. That is the hour.", "Look at the <b>long hand</b>. That is the minutes.", "Each number on the clock is 5 minutes for the long hand.", "Work out the time.", "<b>Tap the right time.</b>"],
  tip: "Start with the short hand." };
G.ruleswitch = { unit: "card",
  goal: "Match the cards. Is the rule colour, shape or number? Watch out, it changes!",
  ready: "Tip the phone to move the pointer. Or use the mouse or touch screen.",
  steps: ["Look at the card at the bottom.", "<b>Tap a top card</b> it goes with.", "Did it say right? Keep that rule.", "Wrong? <b>Try a different rule.</b>", "It says 'Not that one'? The rule changed!"],
  tip: "Say the rule out loud: colour, shape or number." };

// ---------------------------------------------------------------- Language
G.nameit = { unit: "picture",
  goal: "Say the name of the picture out loud. Then tap the right word.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Look at the picture.</b>", "<b>Say its name</b> out loud.", "Stuck? Tap <b>Hint</b>. It shows the first letter.", "Tap <b>Hint</b> again to hear what it is for.", "<b>Tap the right word.</b>"],
  tip: "Saying it out loud is the real exercise. It doesn't need to be perfect." };
G.wordpic = { unit: "word",
  goal: "Hear a word. Tap its picture!",
  ready: "Turn the sound on. Tap the screen, or use the mouse.",
  steps: ["<b>Listen</b> to the word.", "<b>Read it</b> at the top.", "<b>Say it</b> out loud.", "Find its picture.", "<b>Tap the picture.</b>"],
  tip: "Say the word out loud before you choose." };
G.wordweb = { unit: "picture",
  goal: "Learn all about each picture. What group is it in? What is it for?",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Look at the picture</b> and its name.", "What <b>group</b> is it in? Tap.", "What is it <b>for</b>? Tap.", "<b>Where</b> do you find it? What is it <b>like</b>? Tap.", "Say your answers out loud."],
  tip: "Think about how you use it at home." };
G.sentence = { unit: "sentence",
  goal: "Find the best word to finish the sentence.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Read the sentence</b> out loud.", "Find the gap.", "<b>Which word fits?</b>", "<b>Tap it.</b>", "Read the sentence again with your word."],
  tip: "Try each word in the gap." };
G.spell = { unit: "word",
  goal: "Spell the word! Tap the letters in the right order.",
  ready: "Tap the screen, or use the mouse.",
  steps: ["<b>Look at the picture.</b> Say the word.", "<b>Tap the first letter.</b>", "Tap the next letter. And the next.", "Wrong letter? Tap <b>Undo</b>.", "Finish the word!"],
  tip: "Say the word slowly, one sound at a time." };

RC.GUIDES = G;
})();
