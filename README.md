kancollector
============

艦コレの自動化プレイヤー Automatically play Kancolle as if I'm playing. (E.g. Go on sorties, do tasks, collect materials and build ships).

How To Use
============
Run as

    node repl.js

then in the command prompt type

 > key {YOUR_KEY_FROM_KANCOLLE}
 
use the help command to view the methods supported

 > help
 
Main Features
============

- Auto enter expeditions. Run `mission [MISSION_ID] [FLEET#] reschedule` to enter expeditions and automatically re-supply and re-enter on completion
- Profiles allow you to save fleet configuration. `profiles copy [NAME] [FLEET#]` copies the current fleet config to [NAME] while `profiles apply [NAME] [FLEET#]` applies the config to the fleet. This allows for more than 4 fleets. and easy exchange

