import test from 'node:test';
import assert from 'node:assert/strict';
import {localRankings,validDifficulty} from '../src/lib/rankings.js';
test('leaderboards isolate difficulties and keep each player best score',()=>{
 const rows=[
  {user_id:'a',display_name:'A',difficulty:'easy',best_score:100},
  {user_id:'a',display_name:'A',difficulty:'easy',best_score:300},
  {user_id:'b',display_name:'B',difficulty:'easy',best_score:200},
  {user_id:'a',display_name:'A',difficulty:'medium',best_score:900},
  {user_id:'c',display_name:'C',difficulty:'hard',best_score:500},
  {user_id:'d',display_name:'Old score',best_score:9999},
 ];
 assert.deepEqual(localRankings(rows,'easy'),[{display_name:'A',best_score:300},{display_name:'B',best_score:200}]);
 assert.deepEqual(localRankings(rows,'medium'),[{display_name:'A',best_score:900}]);
 assert.deepEqual(localRankings(rows,'hard'),[{display_name:'C',best_score:500}]);
});
test('unclassified, invalid and empty scores are not assigned to a mode',()=>{
 assert.equal(validDifficulty('expert'),false);
 assert.deepEqual(localRankings(null,'easy'),[]);
 assert.deepEqual(localRankings([{best_score:900}],'easy'),[]);
 assert.deepEqual(localRankings([{difficulty:'easy',best_score:-1}],'easy'),[]);
 assert.deepEqual(localRankings([{difficulty:'easy',best_score:10}],'bad'),[]);
});
