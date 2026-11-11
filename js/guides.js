// What the patient reads before each exercise starts (the setup sheet in js/engine.js).
// One entry per exercise id:
//   goal   one or two sentences: what you are trying to do and what happens on screen when you do it
//   ready  how to sit or stand and what to have ready (the phone grip itself is the exercise's `mount`)
//   steps  3 or 4 short numbered steps, in order, as the patient does them (<b> marks the key action)
//   rep    what counts as one repetition (left out for timed exercises)
//   tip    one cue for doing it well
//   unit   the word for one repetition, for "Today: 10 lifts" ("box|boxes" when the plural is irregular)
//   safe   optional: replaces the standard safety line chosen from the exercise's position
// Wording is plain and short on purpose: many patients have aphasia or tire easily when reading.
(() => {
"use strict";
const RC = window.RC;
const G = {};

// ---------------------------------------------------------------- Arm & shoulder
G.lift = { unit: "lift",
  goal: "Raise your arm in front of you to lift the lantern into the gold ring, and hold it there. Each lift lights another lantern in the garden.",
  ready: "Sit tall in a sturdy chair at a table. Rest your forearm on the table to start.",
  steps: ["<b>Lift your whole arm</b> up in front of you, elbow straight. The lantern rises with it.", "<b>Stop in the gold ring</b> and hold still while the green fills.", "<b>Lower slowly</b> back to the table and rest a moment."],
  rep: "Lift into the ring, hold until it fills, lower to the table.",
  tip: "Lift from the shoulder. Keep your elbow straight and your shoulder down, away from your ear." };
G.sideraise = { unit: "raise",
  goal: "Lift your arm out to the side and the scarecrow lifts its arm with you. Hold it up and a bird lands on its hand.",
  ready: "Sit tall near the front of a chair without armrests. Let your arm hang straight down by your side.",
  steps: ["<b>Raise your arm out to the side</b>, elbow straight, thumb pointing forward.", "When the dot on the bar reaches the <b>green part</b>, hold still while it fills.", "<b>Lower slowly</b> back down to your side."],
  rep: "Out to the green, hold, back down by your side.",
  tip: "Don't lean your body the other way or shrug your shoulder. Only the arm moves." };
G.reach = { unit: "window",
  goal: "Shine your torch on the window with the green ring and hold it there. The light comes on and whoever lives there waves hello.",
  ready: "Sit tall facing the screen. Hold your arm out in front of you, pointing the phone at the screen.",
  steps: ["Find the window with the <b>green ring</b>.", "<b>Move your whole arm</b> to point the torch at it: up, down, left or right.", "<b>Hold still</b> on that window until the light comes on. Then another window gets the ring."],
  rep: "Point at the window and hold until its light comes on.",
  tip: "Move from your shoulder, not just your wrist. Slow and steady is easier to aim." };
G.cupmouth = { unit: "sip",
  goal: "Bring the mug of hot cocoa up to your mouth for a sip, hold it there, then put it back down on the table.",
  ready: "Sit at a table with your forearm resting on it, holding the phone upright like a mug.",
  steps: ["<b>Bend your elbow</b> to bring the phone up toward your mouth, tipping it toward you like a mug.", "<b>Hold it there</b> for your sip while the green fills.", "<b>Lower it slowly</b> back to the table and rest."],
  rep: "Up to your mouth, hold for the sip, back to the table.",
  tip: "Bring the cup to your mouth, not your mouth to the cup: keep your back against the chair." };
G.push = { unit: "push",
  goal: "Slide each curling stone down the ice with one smooth push forward. Two penguins sweep the ice ahead of it.",
  ready: "Sit tall. Bend your elbow and hold your hand near your chest, phone flat in your fist.",
  steps: ["<b>Hold still</b> for a moment with your hand near your chest.", "<b>Push your hand straight forward</b> in one smooth movement, until your elbow is straight.", "<b>Bring it back</b> to your chest and hold still. The next stone is then ready."],
  rep: "One push out and back.",
  tip: "Straighten your elbow all the way. Keep your back against the chair; don't lean forward." };
G.trace = { unit: "shape",
  goal: "Fly the little plane along the dotted shape in the sky. It leaves a smoke trail wherever it goes.",
  ready: "Sit tall facing the screen. Hold your arm out in front of you, pointing the phone at the screen.",
  steps: ["<b>Point at the orange dot</b> to bring the plane to the start.", "<b>Move your arm slowly</b> to fly along the dotted line.", "Follow it all the way to the end. Level 1 is a circle, level 2 a square and level 3 a figure-8."],
  rep: "From the orange dot all the way to the end of the line.",
  tip: "Go slowly. If you slip off the line, come back to it and carry on." };
G.gate = { unit: "swing",
  goal: "Swing the farm gate open with your forearm and hold it open while the sheep walks through.",
  ready: "Sit tall. Tuck your elbow against your side, bent to a right angle, hand pointing forward.",
  steps: ["Keeping your <b>elbow tucked in</b>, swing your forearm <b>out to the side</b>, like opening a gate.", "<b>Hold it open</b> in the green while the sheep walks through.", "<b>Swing it back</b> to the front and rest."],
  rep: "Open the gate, hold, swing it back.",
  tip: "Your elbow stays against your side the whole time. A rolled towel under your arm helps." };
G.paint = { unit: "stroke",
  goal: "Paint the fence with long brush strokes, all the way up and all the way down. Every stroke paints a board.",
  ready: "Sit tall with your arm out in front of you, holding the phone like a paintbrush.",
  steps: ["<b>Raise your arm</b> to bring the brush up to the top target.", "<b>Lower your arm</b> to bring it down to the bottom target.", "Keep going <b>up and down</b> in a steady rhythm. A finished fence starts again in a new colour."],
  rep: "One stroke up and one down.",
  tip: "Long, smooth strokes with your whole arm, not flicks of the wrist." };
G.pendulum = { unit: "swing",
  goal: "Let your arm hang and swing it gently from side to side. The bunny on the rope swing goes with you, and every swing makes a flower bloom.",
  ready: "Lean forward with your good hand on a table. Let your affected arm hang loose, straight down.",
  steps: ["<b>Let your arm hang</b> relaxed, like a rope.", "<b>Rock your body gently</b> so the arm swings out to one side.", "Let it <b>swing across</b> to the other side, and keep it going gently."],
  rep: "One swing to each side.",
  tip: "Let your body rock the arm. The arm itself stays relaxed; don't force it." };
G.pressdown = { unit: "press",
  goal: "Push the handle of the garden pump down and hold it. Water pours, and every press brings a duckling over to swim.",
  ready: "Sit tall. Bend your elbow so your forearm points up and forward, phone flat in your fist.",
  steps: ["<b>Straighten your elbow</b> to push your hand down until your arm is straight.", "<b>Hold it down</b> in the green while the water pours.", "<b>Let your hand come back up</b> slowly to the start."],
  rep: "Push down, hold, come back up.",
  tip: "Keep your upper arm still by your side; only the elbow moves." };
G.tennis = { unit: "swing",
  goal: "Hit the balls from the ball machine: a forehand to one side, then a backhand to the other.",
  ready: "Sit or stand with your arm in front of you, gripping the phone like a racket. Use a wrist strap.",
  steps: ["<b>Swing across</b> to your forehand side to hit the first ball.", "Then <b>swing across</b> to your backhand side for the next one.", "Keep going side to side. The banner tells you which side is next."],
  rep: "One forehand and one backhand.",
  tip: "Turn from the shoulder with a firm grip. Smooth swings, not fast jerks." };
G.airplane = { unit: "flight",
  goal: "Lift your arm out to the side like a wing and hold it there. The plane flies through the golden rings to the next island.",
  ready: "Sit tall in a chair without armrests. Let your arm hang straight down by your side.",
  steps: ["<b>Raise your arm out to the side</b>, elbow straight, into the green band.", "<b>Hold it there</b> while the plane flies through the rings. The banner counts the seconds down.", "<b>Lower and rest</b> before the next flight."],
  rep: "Lift into the band and hold until you reach the island.",
  tip: "Breathe normally while you hold. If your arm tires, holding a little lower is fine." };
G.moon = { unit: "",
  goal: "Keep your paper lantern beside the moon as it drifts slowly up and down across the night sky.",
  ready: "Sit tall at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Raise or lower your arm</b> to move the lantern.", "Keep the dot on the bar <b>inside the green part</b>. The lantern glows when you're on target.", "Keep following the moon until the time runs out. The little stars show where it goes next."],
  tip: "Smooth, slow moves work best. Watch the stars ahead so the turns don't surprise you." };
G.stir = { unit: "circle",
  goal: "Stir the camp soup in big, slow circles. Every full circle drops another vegetable into the pot.",
  ready: "Sit at a table holding the phone upright, like a spoon standing in a pot.",
  steps: ["<b>Tip the phone out</b> until the dot on the round pad reaches the ring.", "<b>Stir all the way round</b> the way the arrow points.", "Halfway through, the arrow turns: <b>stir the other way</b>."],
  rep: "Once all the way round the ring.",
  tip: "Make big circles from your shoulder and elbow, and keep your wrist firm." };
G.fruit = { unit: "fruit|fruit",
  goal: "Slide the basket under the falling fruit to catch it. The shadow on the grass shows where each one will land.",
  ready: "Sit tall facing the screen. Hold your arm out, pointing the phone at the screen.",
  steps: ["Look for the next piece of fruit and its <b>shadow</b> on the grass.", "<b>Move your arm left or right</b> to slide the basket under it.", "Get there early and wait for it to drop in."],
  rep: "Each falling fruit, caught or missed.",
  tip: "Move from your shoulder. Small movements are enough." };
G.quickreach = { unit: "reach|reaches",
  goal: "Bop the moles in the vegetable patch. Wait in the middle, and when a mole pops up, reach toward it as fast as you can.",
  ready: "Sit tall facing the screen. Hold your arm out, pointing the phone at the middle of the screen.",
  steps: ["<b>Hold still in the middle</b> and wait.", "When a mole pops up, <b>reach toward it quickly</b>: up, down, left or right.", "<b>Come back to the middle</b> and wait for the next one."],
  rep: "One quick reach to a mole, then back to the middle.",
  tip: "Wait for the mole before you move. Fast is good, but steady is better." };
G.reachturn = { unit: "door",
  goal: "Reach up to the round door handle, then turn your hand to open the door. A friend inside waves hello.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Step 1: lift your arm</b> to reach up to the handle.", "<b>Step 2: turn your hand</b> palm-up to open the door. The numbered chips show which step you're on.", "<b>Come back to rest</b> on the table before the next door."],
  rep: "Reach, turn, back to the table.",
  tip: "Finish the reach before you turn. Keep the turn in your forearm." };
G.drawsword = { unit: "sword",
  goal: "Pull the sword from the stone: sweep your arm up across your body and out to the side. A banner rises on the castle.",
  ready: "Sit tall. Start with your hand by your opposite hip, phone flat in your fist.",
  steps: ["<b>Step 1: sweep up</b> and across your body.", "<b>Step 2: carry it out</b> to the side and up high, like holding up a sword.", "<b>Bring it back down</b> to your opposite hip for the next one."],
  rep: "Up, out to the side, and back to the hip.",
  tip: "Watch your hand as it moves, and turn your thumb back as you finish." };
G.bowling = { unit: "bowl",
  goal: "Bowl the ball down the lane and stop it on the green mat to send the pins flying. A harder swing rolls further.",
  ready: "Sit or stand with the phone gripped tightly. Use a wrist strap and never let go.",
  steps: ["Look where the green mat is. Near needs a soft swing; far needs a harder one.", "<b>Swing your arm back</b>, then <b>forward</b>, as if bowling.", "Watch where the ball stops, then rest your arm. Change the next swing to match."],
  rep: "Every swing is one bowl. Stopping on the mat scores.",
  tip: "Hold on firmly. Control the swing; don't fling it." };
G.spotlight = { unit: "bow",
  goal: "Put the spotlight on the monkey acrobat and hold it there while it takes a bow.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["See how high the monkey has climbed on the rope.", "<b>Raise or lower your arm</b> to move the beam onto it (the green mark on the bar).", "<b>Hold very still</b> while it bows. Then it climbs to a new height."],
  rep: "Light up the monkey and hold until it bows.",
  tip: "Make tiny adjustments when you're close." };

// ---------------------------------------------------------------- Wrist & forearm
G.pour = { unit: "cup",
  goal: "Turn your hand to tip the teapot and fill each cup to the green line, then turn the pot back up. Pour slowly or it splashes.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist like a pan handle.",
  steps: ["<b>Turn your hand slowly</b>, as if tipping a teapot. Tea starts to pour.", "<b>Stop at the green line</b> on the cup.", "<b>Turn the pot back up</b>. The full cup slides away and the next one comes."],
  rep: "Fill one cup to the line and turn the pot back up.",
  tip: "Keep your elbow on the table; the turn comes from your forearm." };
G.lock = { unit: "code",
  goal: "Open the safe. Remember the code on the note, then turn your wrist to dial each number and hold it there.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Read the code</b> on the note while it shows, and remember it.", "<b>Turn your wrist</b> to swing the pointer to the first number.", "<b>Hold still</b> on the number to enter it, then dial the next one. Get them all right and the safe opens."],
  tip: "Say the numbers out loud while you dial; it helps you remember." };
G.maze = { unit: "maze|mazes",
  goal: "Tilt your hand like a tray to roll the steel ball through the wooden maze to the flag, without bumping the walls.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Tip the front of the phone</b> down or up to roll the ball forward or back.", "<b>Turn your hand</b> left or right to roll it sideways.", "Bring the phone <b>level to stop</b>. Reach the flag to finish the maze."],
  rep: "Roll the ball from the start all the way to the flag.",
  tip: "Gentle tilts are enough. Your forearm stays on the table; the wrist does the work." };
G.wristbend = { unit: "strike",
  goal: "Ring the garden gong. Bend your wrist up to lift the mallet, then down to strike, and the koi jump in the pond.",
  ready: "Rest your forearm on the table with your wrist just past the edge, palm down.",
  steps: ["<b>Bend your wrist up</b> to lift the mallet to the top line.", "<b>Bend it down</b> to the bottom line to strike the gong.", "Keep going up and down. The banner shows which way is next."],
  rep: "Wrist up and then down.",
  tip: "Keep your forearm flat on the table; only the hand moves." };
G.wiper = { unit: "wipe",
  goal: "Clear the rain off the windscreen. Sweep your hand side to side and the wiper follows.",
  ready: "Rest your forearm on the table, palm down on top of the phone.",
  steps: ["<b>Slide your hand sideways</b> toward the lit side, keeping your forearm still.", "Reach the green and <b>hold</b> for a moment.", "Then <b>sweep across</b> to the other side."],
  rep: "One sweep to each side.",
  tip: "Your hand slides on the table like a wiper; the forearm doesn't move." };
G.steady = { unit: "",
  goal: "Carry the lemonade on a tray without spilling. Keep the tray level so the bubble stays inside the green circle.",
  ready: "Sit at a table with your forearm resting on it and the phone flat on your open palm.",
  steps: ["<b>Hold your hand level</b>, like carrying a tray.", "Keep the bubble <b>inside the green circle</b>. The circle slowly gets smaller.", "Keep going until the time runs out."],
  tip: "Small, slow corrections are best. Relax your shoulders and breathe." };
G.key = { unit: "turn",
  goal: "Unlock the treasure chest on the beach. Turn your hand like turning a key, hold it, and the lid flies open.",
  ready: "Sit at a table with your forearm resting on it, thumb on top of the phone.",
  steps: ["<b>Turn your palm up</b> as far as is comfortable, like turning a key.", "<b>Hold it</b> in the green while the chest opens.", "<b>Turn back</b> to thumb-up. The lid closes for the next one."],
  rep: "Turn, hold, turn back.",
  tip: "Keep your elbow by your side and on the table, so the turn comes from the forearm." };
G.drawbridge = { unit: "lift",
  goal: "Lift your hand at the wrist to raise the drawbridge, and hold it up while the little boat sails underneath.",
  ready: "Rest your forearm on the table with your wrist just past the edge, palm down.",
  steps: ["<b>Lift your hand up</b> at the wrist into the green band.", "<b>Hold it there</b> until the boat is through. The banner counts the seconds.", "<b>Relax your hand</b> down and rest."],
  rep: "Lift, hold until the boat is through, relax.",
  tip: "Keep your fingers relaxed; lift from the wrist only." };
G.wheel = { unit: "arch|arches",
  goal: "Drive the little red car down the country road and steer through the green arches.",
  ready: "Sit tall holding the phone upright in both hands, one on each side, like a steering wheel.",
  steps: ["Look for the lane with the <b>green arch</b>.", "<b>Turn the phone</b> like a wheel to move into that lane.", "Line up early, then <b>hold the wheel steady</b> as you drive through."],
  rep: "Drive under it in the right lane.",
  tip: "Turn with both hands together, like a real wheel." };
G.wristcircle = { unit: "circle",
  goal: "Turn the animal carousel by circling your wrist. Every full circle lights another string of bulbs.",
  ready: "Rest your forearm on the table with your wrist just past the edge, palm down.",
  steps: ["<b>Tilt your hand</b> until the dot on the round pad reaches the ring.", "<b>Circle all the way round</b> the way the arrow points.", "Halfway through, the arrow turns: <b>circle the other way</b>."],
  rep: "Once all the way round the ring.",
  tip: "Slow, big circles. Your forearm stays still on the table." };
G.water = { unit: "plant",
  goal: "Water the garden. Turn toward the plant, then tip the can to pour. Each plant grows a little every time.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Step 1: turn your hand</b> toward the plant that's shown.", "<b>Step 2: tip the front of the phone down</b> and hold it while the water pours.", "<b>Come back to the middle</b> for the next plant."],
  rep: "Aim, pour, back to the middle.",
  tip: "Do one step at a time; the numbered chips show where you are." };
G.jar = { unit: "twist|twists",
  goal: "Open the cookie jar. Twist the lid back and forth and it loosens a bit each time, until it pops off.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Twist your hand</b> one way into the green.", "Then <b>twist it back</b> the other way.", "Keep going back and forth until the lid comes off."],
  rep: "One twist each way.",
  tip: "Keep your elbow still; the twist comes from your forearm." };
G.scoophold = { unit: "scoop",
  goal: "Serve ice cream to the animals. Curl your wrist down to dip the scoop, and hold it to make a ball of ice cream.",
  ready: "Rest your forearm on the table with your hand over the edge, palm down.",
  steps: ["<b>Curl your wrist down</b> into the green band.", "<b>Hold it there</b> while the scoop forms. The banner counts the seconds.", "<b>Relax</b> your hand back to level and rest."],
  rep: "Curl down, hold until the scoop is made, relax.",
  tip: "Move only at the wrist; keep your forearm on the table." };
G.fill = { unit: "glass|glasses",
  goal: "Run the lemonade stand. Tip the jug just enough to pour, and keep it steady until the glass is full.",
  ready: "Sit at a table with your forearm resting on it, phone upright in your fist like a jug.",
  steps: ["<b>Tip the phone sideways</b> into the green band. Lemonade starts to pour.", "<b>Keep it steady</b> in the band until the glass fills to the line.", "<b>Turn it back up</b>. The glass goes to the next thirsty animal."],
  rep: "Fill one glass.",
  tip: "Tip too far and it stops pouring. Small adjustments keep you in the band." };
G.soup = { unit: "spoonful",
  goal: "Eat your soup. Turn your hand to scoop with the spoon, then lift it up to your mouth.",
  ready: "Sit at a table, phone flat in your fist like a spoon resting in the bowl.",
  steps: ["<b>Step 1: turn your hand</b> to scoop up the soup.", "<b>Step 2: lift the spoon</b> up to your mouth.", "<b>Lower it</b> back to the bowl for the next spoonful."],
  rep: "Scoop, lift, back to the bowl.",
  tip: "Bring the spoon to your mouth; keep your back against the chair." };
G.sail = { unit: "",
  goal: "Sail the boat down the channel between the buoys. Turn your hand to follow the wind as it shifts.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Turn your hand</b> left or right to steer.", "Keep the dot on the bar <b>inside the green part</b> to stay on course.", "Keep sailing until the time runs out and you reach the lighthouse."],
  tip: "Smooth, slow turns work best. Look ahead to see where the channel bends." };

// ---------------------------------------------------------------- Hand & fingers
G.tap = { unit: "",
  goal: "Tap the lit lane as fast as you can until the time runs out.",
  ready: "Rest your affected hand next to the phone or the screen, fingers ready.",
  steps: ["Find the <b>lit lane</b>.", "<b>Tap it</b> with your affected hand, as fast as you can.", "On levels 2 and 3 the light moves between fingers: follow it."],
  tip: "Keep your wrist resting down and tap from the finger, not the whole arm." };
G.rhythm = { unit: "note",
  goal: "Play the falling notes. Tap each note's lane just as it reaches the green line.",
  ready: "Put one finger over each lane on the phone or the screen.",
  steps: ["<b>Watch the notes</b> fall down their lanes.", "When a note reaches the <b>green line</b>, tap its lane.", "Use the finger that sits over that lane."],
  rep: "Each note, hit or missed.",
  tip: "Watch the line, not the top of the screen." };
G.dial = { unit: "number",
  goal: "Dial the phone number you see on the keypad. On level 3 the number disappears after 3 seconds, so remember it.",
  ready: "Use the keypad on your phone, or the one on the screen.",
  steps: ["<b>Read the number</b>. Say it out loud if that helps.", "<b>Type it</b> on the keypad with your affected hand.", "Use <b>←</b> to fix a mistake."],
  tip: "Read it in small chunks, like 555 · 12 · 34." };
G.pinch = { unit: "item",
  goal: "Pick up the small items and drop them into the green box. Higher levels use smaller items.",
  ready: "Use the touchscreen or trackpad with your affected hand.",
  steps: ["<b>Press on an item</b> and keep your finger down.", "<b>Drag it</b> over to the green box.", "<b>Let go</b> inside the box."],
  rep: "One item in the box.",
  tip: "Go slowly and carefully. Accuracy matters more than speed." };
G.grip = { unit: "squeeze|squeezes",
  goal: "Squeeze a soft ball or rolled towel hard, then open your hand wide.",
  ready: "Have a soft ball or a rolled-up towel. Rest your forearm on the table.",
  steps: ["<b>Squeeze</b> the ball for a slow count of three.", "<b>Let go and open your fingers wide</b>.", "Press <b>Done</b> (on the phone, the screen, or the space bar)."],
  rep: "Squeeze, open wide, press Done.",
  tip: "Open your fingers all the way; the opening is as important as the squeeze." };
G.putty = { unit: "squeeze|squeezes",
  goal: "Squeeze a ball of putty or play dough in your fist, then roll it back into a ball.",
  ready: "Have therapy putty or play dough. Sit at a table.",
  steps: ["<b>Hold the putty</b> in your affected hand.", "<b>Squeeze it</b> as hard as is comfortable.", "<b>Roll it back</b> into a ball, then press <b>Done</b>."],
  rep: "Squeeze, roll it back, press Done.",
  tip: "Use all your fingers. Stop if your hand cramps." };
G.curls = { unit: "curl",
  goal: "Curl your fingers into a hook, then straighten them all the way.",
  ready: "Rest your forearm on the table, palm up.",
  steps: ["<b>Bend your fingers</b> into a hook, keeping the big knuckles straight.", "<b>Straighten them</b> all the way out.", "Press <b>Done</b> and do the next one."],
  rep: "Hook, straighten, press Done.",
  tip: "Move slowly and feel each finger bend. Use your other hand to help if needed." };
G.thumbs = { unit: "round",
  goal: "Touch your thumb to each fingertip in turn, from your index finger to your little finger.",
  ready: "Hold your affected hand up in front of you, palm facing you.",
  steps: ["Touch your thumb to your <b>index finger</b>.", "Then the <b>middle</b>, <b>ring</b> and <b>little</b> fingers.", "That's one round. Press <b>Done</b> and start again."],
  rep: "Thumb to all four fingertips, then press Done.",
  tip: "Make a round 'O' shape each time, tip to tip." };
G.clothespin = { unit: "",
  goal: "Pinch clothespins open and clip them onto the edge of a box or cup, then take them off again.",
  ready: "Put a box or cup and a few clothespins on the table in front of you.",
  steps: ["<b>Pinch a clothespin open</b> with your affected hand.", "<b>Clip it</b> on the edge of the box.", "When they're all on, <b>take them off</b> again. Keep going until the time is up."],
  tip: "Use the tips of your thumb and finger, not the whole hand." };
G.coins = { unit: "",
  goal: "Pick up coins one at a time and drop them into a cup.",
  ready: "Spread some coins on the table next to a cup.",
  steps: ["<b>Pick up one coin</b> with your affected hand.", "<b>Drop it</b> into the cup.", "When they're all in, tip them out and start again until the time is up."],
  tip: "Slide a coin to the edge of the table if it's hard to pick up flat." };
G.buttons = { unit: "",
  goal: "Practise getting dressed: undo the buttons on a shirt, then do them up again.",
  ready: "Lay a buttoned shirt on the table, or wear one.",
  steps: ["<b>Undo the buttons</b>, using both hands.", "<b>Do them up</b> again.", "Keep going until the time is up."],
  tip: "Start with the biggest buttons. Use your affected hand as much as you can." };
G.knifefork = { unit: "",
  goal: "Practise cutting food with a knife and fork, using both hands together.",
  ready: "Put play dough or soft food on a plate, with a knife and fork.",
  steps: ["Hold the <b>fork</b> in one hand and the <b>knife</b> in the other.", "<b>Cut small pieces</b>, holding the food still with the fork.", "Switch hands if you can. Keep going until the time is up."],
  tip: "Press your index finger along the top of the knife for control." };
G.mole = { unit: "mole",
  goal: "Whack the mole! Tap the hole it pops out of before it hides again.",
  ready: "Rest your affected hand by the phone's keypad or the screen.",
  steps: ["<b>Watch the holes</b>.", "When a mole pops up, <b>tap that hole</b> fast.", "Then get ready for the next one. Higher levels hide it faster."],
  rep: "Each mole, hit or missed.",
  tip: "Rest your hand in the middle so every hole is close." };
G.scales = { unit: "pattern",
  goal: "Play a finger pattern in order, like practising scales on a piano.",
  ready: "Put one finger over each lane: index finger on lane 1.",
  steps: ["<b>Read the numbers</b>: 1 is your index finger, 4 your little finger.", "<b>Tap the lanes in that order</b>, one finger at a time.", "Level 2 goes up and back down; level 3 skips around."],
  tip: "Keep the other fingers still while one finger taps." };
G.drum = { unit: "",
  goal: "Play a drum roll: alternate two fingers as fast as you can until the time runs out.",
  ready: "Put two fingers over the two lit lanes.",
  steps: ["<b>Tap one lane</b>, then <b>the other</b>.", "Keep going <b>back and forth</b> as fast as you can.", "Levels 2 and 3 use fingers further apart."],
  tip: "Even taps beat fast messy ones; find a rhythm." };
G.beat = { unit: "beat",
  goal: "Tap exactly in time with a steady beat, like clapping along to music.",
  ready: "Turn the sound on. Rest your finger over the button.",
  steps: ["<b>Listen</b> to the beat for a moment.", "<b>Tap the button</b> exactly on each beat.", "Keep tapping in time until it stops."],
  tip: "Nod your head along to the beat, then tap with it." };
G.numhunt = { unit: "round",
  goal: "The keys are shuffled. Find and tap 1 to 9 in order, as quickly as you can.",
  ready: "Use the keypad on your phone, or the one on the screen.",
  steps: ["<b>Find the 1</b> and tap it.", "Then find and tap <b>2, 3</b> and on up to <b>9</b>.", "The keys shuffle for every round."],
  rep: "1 to 9 in order.",
  tip: "Look across the whole keypad, left to right, before you tap." };
G.typeword = { unit: "word",
  goal: "Type a short word on the letter pad.",
  ready: "Use the letter pad on your phone, or the one on the screen.",
  steps: ["<b>Read the word</b>.", "<b>Tap its letters</b> in order with your affected hand.", "Use <b>←</b> to fix a mistake."],
  tip: "Say each letter out loud as you tap it." };
G.tapcount = { unit: "round",
  goal: "Tap exactly the number of times shown, then stop.",
  ready: "Rest your finger over the button on the phone or the screen.",
  steps: ["<b>Read the number</b>.", "<b>Tap that many times</b>, at your own pace, counting out loud.", "<b>Stop and wait</b>. It checks your count."],
  rep: "One number tapped out.",
  tip: "Count each tap out loud." };
G.pegboard = { unit: "peg",
  goal: "Put every peg into a hole as quickly as you can.",
  ready: "Use the touchscreen or trackpad with your affected hand.",
  steps: ["<b>Press on a peg</b> and keep your finger down.", "<b>Drag it</b> to an empty hole.", "<b>Let go</b> right over the hole. Fill them all."],
  rep: "One peg in a hole.",
  tip: "Higher levels need more exact drops, so slow down near the hole." };
G.shake = { unit: "shake",
  goal: "Shake the snow globe! Every shake swirls the snow, and a little winter village appears inside, piece by piece.",
  ready: "Sit tall with the phone gripped tightly in your fist. Use a wrist strap and never let go.",
  steps: ["<b>Hold the phone tightly</b>.", "<b>Shake it up and down</b> in short, quick movements.", "Keep going until the village is finished."],
  tip: "Short shakes from the elbow. Keep a firm grip the whole time." };
G.pengrip = { unit: "drawing",
  goal: "Hold the phone like a pen and trace each picture on the paper. The crayon line follows you.",
  ready: "Sit at a table with your forearm resting on it. Hold the phone upright, like a big pen.",
  steps: ["<b>Tilt the phone</b> to move the pencil to the <b>orange start dot</b>.", "<b>Follow the dotted line</b> slowly to the end.", "A finished drawing is pinned up and the next one starts."],
  rep: "From the orange dot all the way to the end of the line.",
  tip: "Hold it with your fingertips, like a pen, and move slowly." };

// ---------------------------------------------------------------- Trunk & legs
G.lean = { unit: "lean",
  goal: "Feed the ducks from the bench. Lean toward the duck with the ring and hold while it eats.",
  ready: "Sit on a firm chair with your feet flat on the floor.",
  steps: ["See which duck has the <b>ring</b>: left, right or in front.", "<b>Lean your body</b> that way, and hold while the duck eats.", "<b>Sit back up</b> in the middle for the next duck."],
  rep: "Lean, hold, back to the middle.",
  tip: "Lean from your hips, keeping your back long. Feet stay flat." };
G.twist = { unit: "animal",
  goal: "Look around the world and find the hidden animals. Turn your shoulders to look, and hold still on an animal to find it.",
  ready: "Sit tall on a chair without wheels, feet flat. Keep your hips facing forward.",
  steps: ["<b>Pick a world</b> from the list below.", "<b>Turn your shoulders</b> to look right, then left.", "When you see the animal you're looking for, <b>hold still</b> on it to find it."],
  rep: "Each animal you find.",
  tip: "Hips and knees stay facing forward; only your upper body turns." };
G.sit2stand = { unit: "stand",
  goal: "Stand up from your chair and sit down again. Each time you stand, you can see over the hedge to the balloon festival.",
  ready: "Use a sturdy chair with armrests, against a wall. Have someone nearby.",
  steps: ["<b>Scoot forward</b>, put your feet back, and lean forward.", "<b>Stand up</b> all the way, using the armrests if you need to.", "<b>Sit down slowly</b>, reaching back for the chair."],
  rep: "Stand up and sit back down.",
  tip: "Nose over toes as you stand. Sit down slowly, don't drop." };
G.balance = { unit: "",
  goal: "Stand tall and still. A new block lands on the tower every few seconds; sway, and the tower wobbles.",
  ready: "Stand at a counter you can hold, with someone nearby. Level 1: feet apart. Level 2: feet together. Level 3: one foot in front of the other.",
  steps: ["<b>Stand tall</b> with your feet in position.", "Keep the dot <b>inside the green circle</b> by standing very still.", "Keep going until the time runs out."],
  tip: "Look at one spot straight ahead. Breathe slowly." };
G.march = { unit: "step",
  goal: "Lead the animal parade! March in your chair, lifting one knee and then the other. Every lift is a step.",
  ready: "Sit tall near the front of a sturdy chair, feet flat.",
  steps: ["<b>Lift one knee</b> as high as is comfortable.", "<b>Lower it</b>, then lift the other knee.", "Keep a steady marching rhythm."],
  rep: "Each knee lift.",
  tip: "Sit up tall and don't lean back as you lift." };
G.heelraise = { unit: "raise",
  goal: "Lift your heels off the floor, hold, and lower them.",
  ready: "Sit with your feet flat, or stand holding a counter.",
  steps: ["<b>Lift both heels</b> up onto your toes.", "<b>Hold</b> for a count of two.", "<b>Lower slowly</b>, then press <b>Done</b>."],
  rep: "Up, hold, down, press Done.",
  tip: "Go straight up and down, not rolling to the side of your foot." };
G.anklepump = { unit: "pump",
  goal: "Pump your ankles: point your toes up toward you, then down.",
  ready: "Sit with your feet flat on the floor, or your legs out in front of you.",
  steps: ["<b>Pull your toes up</b> toward your shins.", "<b>Point them down</b> away from you.", "Press <b>Done</b> and repeat in a steady rhythm."],
  rep: "Toes up, toes down, press Done.",
  tip: "Move slowly and go as far as is comfortable each way." };
G.floor = { unit: "egg",
  goal: "Gather the eggs. Lean forward toward the floor to reach the nest with your grabber, and hold to pick up the egg.",
  ready: "Sit near the front of a sturdy chair, feet flat and apart.",
  steps: ["<b>Lean forward</b> from your hips and reach down toward your feet.", "<b>Hold</b> there while the grabber picks up the egg.", "<b>Sit back up</b> tall. The hen lays the next one."],
  rep: "Reach down, hold, sit up.",
  tip: "Lean from your hips and keep your feet flat. Hold the chair if you feel unsteady." };
G.sidereach = { unit: "apple",
  goal: "Pick the apples. Reach out to the side to the glowing apple and hold; it drops into your basket.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Reach out to the side</b> past your knee, leaning your body with it.", "<b>Hold</b> while the apple is picked.", "<b>Sit back up</b> in the middle."],
  rep: "Reach out, hold, back to the middle.",
  tip: "Shift your weight onto that hip, but keep both feet flat on the floor." };
G.rock = { unit: "stroke",
  goal: "Row the boat down the river. Lean forward to reach the oars, then lean back to pull.",
  ready: "Sit on a firm chair with your feet flat on the floor.",
  steps: ["<b>Lean forward</b> from your hips to the front target.", "<b>Lean back</b> past upright to the back target.", "Keep rowing in a slow, steady rhythm."],
  rep: "One lean forward and one back.",
  tip: "Move from your hips with a straight back, slowly." };
G.trunkcircle = { unit: "circle",
  goal: "Help the panda hula hoop. Circle your upper body and the hoop spins; every full circle earns a new hoop.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Lean out</b> until the dot on the round pad reaches the ring.", "<b>Circle your upper body</b> round the way the arrow points: forward, side, back, side.", "Halfway through, the arrow turns: <b>circle the other way</b>."],
  rep: "Once all the way round the ring.",
  tip: "Slow, smooth circles. Your hips stay on the chair." };
G.kneeext = { unit: "kick",
  goal: "Straighten your knee to lift your foot up to the ball and hold it there. The ball powers up and flies into the net.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Straighten your knee</b> to lift your foot off the floor.", "<b>Hold</b> it up while the ball powers up.", "<b>Lower slowly</b> back to the floor."],
  rep: "Lift, hold, lower.",
  tip: "Pull your toes up toward you as you straighten." };
G.kneeout = { unit: "opening",
  goal: "Open the butterfly's wings. Move your knee out to the side and hold; the butterfly flies away and the next one lands.",
  ready: "Sit tall with your feet flat on the floor.",
  steps: ["<b>Let your knee move out</b> to the side, keeping your foot on the floor.", "<b>Hold</b> it out while the wings stay open.", "<b>Bring it back</b> to the middle."],
  rep: "Knee out, hold, back in.",
  tip: "Keep your foot planted and your back still." };
G.foottilt = { unit: "lift",
  goal: "Lift the front of your foot to raise the marble run, and hold it up while the marble rolls into the jar.",
  ready: "Sit with your foot flat on the floor.",
  steps: ["<b>Lift your toes</b> and the front of your foot, heel stays down.", "<b>Hold</b> while the marble rolls down.", "<b>Put your foot down</b> slowly."],
  rep: "Lift, hold, lower.",
  tip: "Keep your heel on the floor the whole time." };
G.ankletrace = { unit: "shape",
  goal: "Walk the crab along the shells. Tilt your foot to move it, and it draws a line in the sand.",
  ready: "Sit with your heel resting on the floor.",
  steps: ["<b>Tilt your foot</b> to move the crab to the <b>orange start dot</b>.", "Tilt up, down and to the sides to <b>follow the line</b>.", "Reach the end of the shape. A wave washes it away for the next one."],
  rep: "From the orange dot all the way to the end of the line.",
  tip: "Move only at the ankle; your heel stays on the floor." };
G.toetap = { unit: "tap",
  goal: "Play the animal band's big drum. Every tap of your foot hits the drum and the band bounces along.",
  ready: "Sit tall with your feet flat on the floor.",
  steps: ["<b>Tap your affected foot</b> forward on the floor.", "<b>Bring it back</b>.", "Keep a steady rhythm."],
  tip: "Lift your foot clearly off the floor each time." };
G.bridge = { unit: "bridge|bridges",
  goal: "Lift your hips and the rope bridge rises out of the creek. Hold it up while an animal walks across.",
  ready: "Lie on your back on a bed or mat, knees bent and feet flat.",
  steps: ["<b>Squeeze your buttocks</b> and lift your hips.", "<b>Hold</b> while the animal walks across.", "<b>Lower slowly</b> back down."],
  rep: "Lift, hold, lower.",
  tip: "Push through your heels. Keep your shoulders and head relaxed on the bed." };
G.standshift = { unit: "shift|shifts",
  goal: "Help the penguin waddle home. Shift your weight from foot to foot and it waddles with you.",
  ready: "Stand at a counter you can hold, feet hip-width apart, with someone nearby.",
  steps: ["<b>Shift your weight</b> onto one foot, keeping both feet on the floor.", "Reach the ring, then <b>shift across</b> to the other foot.", "Keep going side to side, slowly."],
  rep: "One shift to the side.",
  tip: "Move your hips over your foot; stay tall, don't bend sideways." };
G.minisquat = { unit: "squat",
  goal: "Help the frog hop across the pond. Bend your knees a little and hold; the frog leaps to the next lily pad.",
  ready: "Stand at a counter you can hold, with a chair behind you and someone nearby.",
  steps: ["<b>Bend your knees</b> a little, as if starting to sit, heels down.", "<b>Hold</b> while the frog gets ready to jump.", "<b>Straighten up</b> tall."],
  rep: "Bend, hold, stand tall.",
  tip: "Knees stay over your toes. Only a small bend is needed." };
G.leanhold = { unit: "cake",
  goal: "Blow out the birthday candles. Lean forward to the cake and hold the lean; the candles go out one by one.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Lean forward</b> from your hips into the green band.", "<b>Hold it</b> while the candles go out. The banner counts the seconds.", "<b>Sit back up</b> and rest."],
  rep: "Lean, hold until the candles are out, sit up.",
  tip: "Lean as if getting ready to stand, nose toward your toes, back straight." };
G.crossreach = { unit: "turn",
  goal: "Feed the animals at the farm fence. Turn your upper body to the side and hold the carrot out while the animal munches.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Turn your shoulders</b> to face the side where the animal waits.", "<b>Hold</b> while it eats.", "<b>Turn back</b> to the front."],
  rep: "Turn, hold, back to the front.",
  tip: "Hips and knees stay facing forward." };
G.neckturn = { unit: "photo",
  goal: "Bird watching at the lake. Turn your head toward the bird that's singing to take its photo.",
  ready: "Sit tall. Hold the phone flat on top of your head with one hand.",
  steps: ["Listen and look for the <b>singing bird</b>.", "<b>Turn your head</b> slowly toward it to bring it to the middle.", "Then turn slowly to the other side for the next bird."],
  rep: "One photo each side.",
  tip: "Turn only as far as is comfortable; keep your shoulders still." };
G.nod = { unit: "nod",
  goal: "Say hello to the owl and the koi. Look up at the owl on the branch, then down at the fish in the pond.",
  ready: "Sit tall. Hold the phone flat on top of your head with one hand.",
  steps: ["<b>Tip your chin down</b> toward your chest to see the koi.", "<b>Lift it up</b> to look at the owl.", "Keep nodding slowly."],
  rep: "One nod down and up.",
  tip: "Move slowly. Stop if you feel dizzy." };
G.gaze = { unit: "turn",
  goal: "Keep your eyes on the golden star in the middle of the screen while you turn your head from side to side.",
  ready: "Sit tall, about an arm's length from the screen. Hold the phone flat on top of your head with one hand.",
  steps: ["<b>Look at the golden star</b> in the middle of the screen.", "<b>Turn your head</b> a little to one side, eyes still on the star.", "Then turn to the other side. Every turn lights a star in the sky."],
  rep: "Each turn of your head.",
  tip: "Small, steady turns. If the star goes blurry, slow down." };
G.eartilt = { unit: "tip",
  goal: "Keep the beach ball on its board. When the picture tips, tip your head the other way to level it.",
  ready: "Sit tall. Hold the phone flat on top of your head with one hand.",
  steps: ["Watch for the <b>picture to tip</b>.", "<b>Tip your head</b> the other way, ear toward shoulder, to level it.", "<b>Hold it level</b> so the ball stays on the board."],
  rep: "Level the picture and hold.",
  tip: "Keep your shoulders down; bring your ear to your shoulder, not your shoulder to your ear." };
G.sidebendhold = { unit: "hold",
  goal: "Sail to the lighthouse. Lean your body to the side into the green band and hold it to fill the sail.",
  ready: "Sit tall in a sturdy chair, feet flat.",
  steps: ["<b>Lean sideways</b> into the green band.", "<b>Hold it</b> while the boat sails. The banner counts the seconds.", "<b>Sit back up</b> straight and rest."],
  rep: "Lean, hold until you reach the lighthouse, sit up.",
  tip: "Bend to the side, not forward. Keep both hips on the chair." };
G.kneelift = { unit: "lift",
  goal: "Fly the hot-air balloon. Lift your knee into the breeze and hold it there to drift across the valley.",
  ready: "Sit tall in a sturdy chair, both feet flat.",
  steps: ["<b>Lift your knee</b> up off the chair into the green band.", "<b>Hold it</b> while the balloon drifts. The banner counts the seconds.", "<b>Lower your foot</b> to the floor and rest."],
  rep: "Lift, hold until you reach the flag, lower.",
  tip: "Sit tall; don't lean back to lift." };
G.penalty = { unit: "kick",
  goal: "Kick the ball into the little goal on the green patch. A harder kick goes further.",
  ready: "Sit tall with your foot on the floor.",
  steps: ["Look where the goal is: near needs a soft kick, far a harder one.", "<b>Kick your lower leg forward</b>.", "Bring your foot back down. Change the next kick to match."],
  rep: "Every kick counts. Landing in the goal scores.",
  tip: "Kick by straightening your knee; your thigh stays on the chair." };
G.anklecircles = { unit: "circle",
  goal: "Spin the potter's wheel. Circle your foot to turn it; each circle makes the clay pot a little taller.",
  ready: "Sit with your heel resting on the floor.",
  steps: ["<b>Tip your foot</b> until the dot on the round pad reaches the ring.", "<b>Circle your toes</b> all the way round, the way the arrow points.", "Halfway through, the arrow turns: <b>circle the other way</b>."],
  rep: "Once all the way round the ring.",
  tip: "Big circles from the ankle; your leg stays still." };
G.anklerock = { unit: "rock",
  goal: "Rock the baby's cradle. Roll your foot to each side and the cradle rocks with it.",
  ready: "Sit with your foot flat on the floor.",
  steps: ["<b>Roll your foot</b> onto its outer edge.", "Then roll it onto its <b>inner edge</b>.", "Keep rocking gently side to side."],
  rep: "One roll to each side.",
  tip: "Your knee stays still; only the ankle rolls." };
G.gaspedal = { unit: "speed",
  goal: "Drive at the right speed. Press or lift your foot to match the speed sign, and hold it to set the cruise control.",
  ready: "Sit with your heel resting on the floor, like on a car pedal.",
  steps: ["<b>Read the speed sign</b> ahead.", "<b>Point your toes down</b> to speed up, or <b>lift them</b> to slow down, until the needle is in the green.", "<b>Hold steady</b> while the ring fills."],
  rep: "Match one speed and hold.",
  tip: "Tiny movements; your heel stays down like a pivot." };
G.cycling = { unit: "pedal",
  goal: "Ride your bike through the park. Pedal your legs as if riding; every push carries you toward the finish arch.",
  ready: "Sit tall with your feet on a pedal exerciser or on the floor.",
  steps: ["<b>Push your leg</b> forward and down.", "<b>Bring it back</b> up.", "Keep a steady pedalling rhythm."],
  rep: "One push and one pull back.",
  tip: "Keep a smooth, even pace rather than fast bursts." };
G.sidelegs = { unit: "lift",
  goal: "Raise the toll gate. Lift your top leg and hold it up while the next little car drives through.",
  ready: "Lie on your side on a bed or mat with your affected leg on top, bottom knee bent.",
  steps: ["<b>Lift your top leg</b> up toward the ceiling, keeping it straight.", "<b>Hold</b> while the car drives through.", "<b>Lower it slowly</b>."],
  rep: "Lift, hold, lower.",
  tip: "Keep your toes pointing forward, not up at the ceiling." };
G.kneerolls = { unit: "roll",
  goal: "Paint a rainbow. Roll your knees from side to side and the brush sweeps along the arc, one colour at a time.",
  ready: "Lie on your back on a bed or mat, knees bent and together.",
  steps: ["<b>Let both knees roll</b> slowly to one side.", "<b>Bring them back over</b> to the other side.", "Keep rolling gently until the rainbow is done."],
  rep: "One roll there and back.",
  tip: "Keep your shoulders flat on the bed. Go only as far as is comfortable." };
G.slalom = { unit: "gate",
  goal: "Ski down the mountain through the flag gates. Shift your weight left and right to steer.",
  ready: "Stand at a counter you can hold, with someone nearby.",
  steps: ["<b>Look at the next gate</b> coming down the hill.", "<b>Shift your weight</b> left or right to steer the skier into line with it.", "Line up early and hold steady as you go through."],
  tip: "Move from your hips; keep both feet on the floor." };
G.heeltoe = { unit: "rock",
  goal: "Ride the seesaw. Rock your foot up and down and the panda and bunny go up and down with you.",
  ready: "Sit with your foot flat on the floor.",
  steps: ["<b>Lift your toes</b> to rock back onto your heel.", "Then <b>press down</b> onto your toes.", "Keep rocking slowly."],
  rep: "One rock up and down.",
  tip: "Go all the way each way, slowly." };
G.chestup = { unit: "lift",
  goal: "Wake up the sunflower. Lift your chest and sit up tall, and the sunflower turns its face to the sun.",
  ready: "Sit near the front of the chair, feet flat.",
  steps: ["<b>Lift your chest</b> and lean back a little.", "<b>Hold</b> it tall while the bees come.", "<b>Relax</b> forward."],
  rep: "Lift, hold, relax.",
  tip: "Squeeze your shoulder blades together gently as you lift." };
G.toeshold = { unit: "fish|fish",
  goal: "Go fishing. Lift your toes to raise the rod into the green band and hold it to reel the fish in.",
  ready: "Sit with your heel on the floor.",
  steps: ["<b>Lift your toes</b> up toward your shin, into the green band.", "<b>Hold</b> while you reel the fish in. The banner counts the seconds.", "<b>Lower your foot</b> and rest."],
  rep: "Lift, hold until the fish is in, lower.",
  tip: "Keep your heel down and lift from the ankle." };

// ---------------------------------------------------------------- Therapy sessions
G.mirror = { unit: "",
  goal: "Trick your brain into seeing your affected arm move. Move both arms while you watch the reflection of your stronger arm.",
  ready: "Put a mirror upright on the table between your arms, with the mirror facing your stronger arm.",
  steps: ["<b>Hide your affected arm</b> behind the mirror.", "<b>Do each movement</b> on the screen with both arms together.", "<b>Watch the mirror</b> the whole time, not your hidden arm."],
  tip: "Imagine the arm in the mirror is your affected arm." };
G.imagery = { unit: "",
  goal: "Practise in your mind. A spoken script walks you through picturing a movement in detail, then trying it.",
  ready: "Sit somewhere quiet and turn the sound on.",
  steps: ["<b>Close your eyes</b> if you like, and listen.", "<b>Picture each movement</b> in detail: what you see, feel and hear.", "Try the movement when asked. Press <b>Next step</b> to move on sooner."],
  tip: "Imagine it from inside your body, as if you're really doing it." };

// ---------------------------------------------------------------- Visual scanning
G.cancel = { unit: "page",
  goal: "Find and tap every star on the page. Make sure you look all the way to the left edge.",
  ready: "Sit straight in front of the screen.",
  steps: ["<b>Start at the top left</b> corner.", "<b>Sweep across each row</b>, left to right, and tap every star.", "When you're sure, tap <b>I've found them all</b>."],
  tip: "Check the left side twice before you finish." };
G.lookleft = { unit: "star",
  goal: "Find the single star. The glowing bar on the left reminds you where to start looking.",
  ready: "Sit straight in front of the screen.",
  steps: ["<b>Look at the glowing bar</b> on the left edge first.", "<b>Sweep your eyes</b> from left to right.", "<b>Tap the star</b> as soon as you see it."],
  tip: "Turn your head to the left, not just your eyes." };
G.bisect = { unit: "line",
  goal: "Tap the exact middle of each line.",
  ready: "Sit straight in front of the screen.",
  steps: ["<b>Look at both ends</b> of the line.", "<b>Tap where you think the middle is</b>.", "The green mark shows the true middle."],
  tip: "Find the left end first; it is easy to miss." };

// ---------------------------------------------------------------- Attention
G.quick = { unit: "catch|catches",
  goal: "Test your reactions: tap the moment the circle appears.",
  ready: "Rest your finger over the button on the phone, or on the screen.",
  steps: ["<b>Keep your finger ready</b> and watch the screen.", "<b>Wait</b> for the circle.", "<b>Tap</b> as soon as it appears. Tapping early doesn't count."],
  tip: "Stay relaxed. Don't guess; wait for it." };
G.gonogo = { unit: "circle",
  goal: "Tap when the circle is green, but hold back when it is orange.",
  ready: "Rest your finger over the button on the phone, or on the screen.",
  steps: ["<b>Watch</b> the circle.", "<b>Green: tap</b>.", "<b>Orange: don't tap</b>; let it pass."],
  tip: "Wait to see the colour before you move." };
G.watch = { unit: "",
  goal: "Keep watch through the night. Shapes appear one at a time; tap only when you see a star.",
  ready: "Rest your finger over the button on the phone, or on the screen.",
  steps: ["<b>Watch the middle</b> of the screen.", "Most shapes are not stars: <b>let them go</b>.", "<b>Tap</b> when a star appears."],
  tip: "Stay focused until the very end; stars can come at any time." };
G.twoatonce = { unit: "",
  goal: "Watch two things at once: tap even numbers on the left, and switch off the lamp on the right.",
  ready: "Use the two keys on your phone, or the two halves of the screen.",
  steps: ["<b>Watch both halves</b> of the screen.", "<b>Tap left</b> when an even number shows (2, 4, 6, 8).", "<b>Tap right</b> when the lamp lights up."],
  tip: "Keep your eyes in the middle so you can see both sides." };
G.trail = { unit: "trail",
  goal: "Connect the circles in order, like a dot-to-dot. Level 3 switches between numbers and letters.",
  ready: "Tilt the phone to move the pointer, or use the mouse or touchscreen.",
  steps: ["<b>Find circle 1</b> and tap it.", "Then tap <b>2, 3</b> and so on.", "On level 3, go <b>1, A, 2, B, 3, C</b>…"],
  tip: "Say the next one out loud before you look for it." };

// ---------------------------------------------------------------- Memory
G.simon = { unit: "pattern",
  goal: "The bell flowers ring in a pattern. Watch it, then tilt your hand toward each flower in the same order; the frog hops to it.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Watch the whole pattern</b> first. Don't move yet.", "<b>Tilt your hand</b> toward each flower in order: up, right, down or left.", "<b>Come back to level</b> between moves."],
  tip: "Say the directions out loud while you watch: up, left, up…" };
G.pairs = { unit: "game",
  goal: "Find all the matching pairs. Turn over two cards at a time.",
  ready: "Tilt the phone to move the pointer, or use the mouse or touchscreen.",
  steps: ["<b>Tap a card</b> to turn it over.", "<b>Tap a second card</b>. If they match, they stay up.", "If not, they turn back. <b>Remember where each picture was</b>."],
  tip: "Work in rows so you remember positions." };
G.nback = { unit: "letter",
  goal: "Is this letter the same as the one before? On level 3, compare it with the letter two before.",
  ready: "Use the Same and Different keys on your phone, or the screen.",
  steps: ["<b>Watch the letter</b> in the box.", "Tap <b>Same</b> if it matches the earlier letter.", "Otherwise tap <b>Different</b>."],
  tip: "Whisper the letters to yourself as they come." };
G.span = { unit: "round",
  goal: "Watch a string of digits, then type it back. It gets one longer each time you get it right.",
  ready: "Use the keypad on your phone, or the one on the screen.",
  steps: ["<b>Watch the digits</b> appear one at a time.", "<b>Type them back</b> in the same order.", "Each right answer adds a digit."],
  tip: "Say them out loud in groups, like a phone number." };
G.wordlist = { unit: "list",
  goal: "Study a list of words, then pick them out from a bigger list.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Read each word</b> and try to remember it.", "Tap <b>I'm ready</b> when you know them.", "<b>Pick the words</b> you studied, then tap <b>Done</b>."],
  tip: "Make a little story that links the words together." };
G.shopping = { unit: "list",
  goal: "Remember a shopping list, then fill your basket from the shelves.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Read the shopping list</b> and remember it.", "Tap <b>I'm ready</b>.", "<b>Tap each item</b> from your list on the shelves, then tap <b>Done</b>."],
  tip: "Picture yourself walking round the shop picking each item." };
G.faces = { unit: "",
  goal: "Learn a few people's names, then name each face.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Look at each face</b> and say its name out loud.", "Tap <b>I'm ready</b> when you know them.", "<b>Pick the right name</b> for each face."],
  tip: "Link each name to something about the face, like 'Rose has a red scarf'." };

// ---------------------------------------------------------------- Reasoning
G.sort = { unit: "word",
  goal: "Sort the crates at the market. Read the word, then turn your hand toward the basket for its group.",
  ready: "Sit at a table with your forearm resting on it, phone flat in your fist.",
  steps: ["<b>Start with your hand level</b>.", "<b>Read the word</b> on the crate, and the two basket signs.", "<b>Turn your hand</b> left or right toward the right basket, and hold."],
  tip: "Come back to level before each new word." };
G.tower = { unit: "puzzle",
  goal: "Move the whole stack of discs to the right-hand peg, one disc at a time. A big disc can never go on a smaller one.",
  ready: "Tilt the phone to move the pointer, or use the mouse or touchscreen.",
  steps: ["<b>Tap a peg</b> to pick up its top disc.", "<b>Tap another peg</b> to put it down.", "Get the whole stack onto the <b>right-hand peg</b>."],
  rep: "One whole stack moved.",
  tip: "Plan a few moves ahead. The smallest disc moves every other turn." };
G.errands = { unit: "plan",
  goal: "Plan your day so every place is open when you get there.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["Each errand takes <b>one hour</b>, starting at 9:00.", "<b>Read when each place opens or closes</b>.", "<b>Tap the errands</b> in the order you'd do them."],
  rep: "One whole day planned.",
  tip: "Do the places that close early first." };
G.next = { unit: "pattern",
  goal: "Find the number or shape that continues the pattern.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Look at the sequence</b>.", "<b>Work out the rule</b>: what changes each time?", "<b>Tap the answer</b> that comes next."],
  tip: "Check the gap between each pair." };
G.rotate = { unit: "pair",
  goal: "Is the shape on the right the same shape turned round, or a mirror image?",
  ready: "Tilt the phone to move the pointer, or use the mouse or touchscreen.",
  steps: ["<b>Look at both shapes</b>.", "<b>Imagine turning</b> the left one round.", "Tap <b>Same shape</b> or <b>Mirror image</b>."],
  tip: "Pick one corner and follow where it goes." };
G.change = { unit: "sale",
  goal: "Pay with exactly the right money. On level 3, give the change instead.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Read the price</b>.", "<b>Tap coins and notes</b> to add up to it.", "Tap <b>Undo</b> if you go over."],
  tip: "Start with the biggest note or coin that fits." };
G.clock = { unit: "clock",
  goal: "Read the clock and pick the right time.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["Look at the <b>short hand</b> for the hour.", "Look at the <b>long hand</b> for the minutes.", "<b>Tap the matching time</b>."],
  tip: "Each number on the clock is 5 minutes for the long hand." };
G.ruleswitch = { unit: "card",
  goal: "Match each card by colour, shape or number. Work out the rule, but watch out: it changes without warning.",
  ready: "Tilt the phone to move the pointer, or use the mouse or touchscreen.",
  steps: ["<b>Tap the top card</b> that the bottom card goes with.", "Use the right / wrong feedback to <b>find the rule</b>.", "When it starts saying 'Not that one', <b>the rule has changed</b>: try another."],
  tip: "Say the rule you're using out loud: colour, shape or number." };

// ---------------------------------------------------------------- Language
G.nameit = { unit: "picture",
  goal: "Say the name of the picture out loud, then tap the right word.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Look at the picture</b> and try to say its name.", "Tap <b>Hint</b> if the word won't come: first the first letter, then what it's for.", "<b>Tap the matching word</b>."],
  tip: "Saying it out loud is the real exercise, even if it isn't perfect." };
G.wordpic = { unit: "word",
  goal: "Hear and read a word, then tap the picture it names.",
  ready: "Turn the sound on. Tap on the screen, or use the mouse.",
  steps: ["<b>Listen</b> to the word.", "<b>Read it</b> at the top.", "<b>Tap the picture</b> it names."],
  tip: "Say the word out loud before you choose." };
G.wordweb = { unit: "picture",
  goal: "Build a web of meaning: for each picture, choose its group, what it's for, where it's found and what it's like.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Look at the picture</b> and its name.", "<b>Answer each question</b> about it.", "Say your answers out loud; it helps the word stick."],
  tip: "There's no rush. Think about how you use it at home." };
G.sentence = { unit: "sentence",
  goal: "Pick the word that best finishes each sentence.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Read the sentence</b> out loud.", "<b>Think what word fits</b> the gap.", "<b>Tap it</b>."],
  tip: "Read the whole sentence again with your word in it." };
G.spell = { unit: "word",
  goal: "Tap the scrambled letters in the right order to spell the word.",
  ready: "Tap on the screen, or use the mouse.",
  steps: ["<b>Look at the picture</b> clue and say the word.", "<b>Tap the first letter</b>, then the next.", "Tap <b>Undo</b> to take a letter back."],
  tip: "Sound the word out slowly, one letter at a time." };

RC.GUIDES = G;
})();
