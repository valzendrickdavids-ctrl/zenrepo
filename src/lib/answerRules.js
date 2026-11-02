export const ANSWER_RULES_VERSION = 2;

// Abbreviations that are alternatives to a longer Moderate answer.
export const abbreviationAliases = {
  javascript:['js'], boolean:['bool'], stack:['lifo'], queue:['fifo'],
  'ip-address':['ipv4'], 'peer-to-peer':['p2p'], mfa:['mfa','2fa'],
  'version-control':['vcs'], 'primary-key':['pk'], 'foreign-key':['fk'],
  'virtual-machine':['vm'], 'operating-system':['os'],
};
const names = Object.fromEntries([
  'CPU','RAM','HDD','USB','LAN','RJ45','CD','DVD','SD','WWW','QR','HTML','CSS',
  'SQL','JSON','XML','CSV','JS','LIFO','FIFO','DNS','DHCP','TCP','UDP','HTTP',
  'HTTPS','URL','VPN','P2P','MFA','2FA','VCS','API','REST','CRUD','PK','FK','VM','OS',
  'Wi-Fi','JavaScript','IPv4',
].map(name=>[name.toLowerCase(),name]));
names.wifi='WiFi';
export const cleanAnswerSpaces = value => value.replace(/\s+/g,' ').trim();
const initialCapital = text => text.replace(/^[a-z]/,letter=>letter.toUpperCase());
export function namedAlias(alias) {
  return initialCapital(alias.split(' ').map(word=>names[word.toLowerCase()]||word).join(' '));
}
export function answerOptions(level) {
  const aliases=(level.aliases||[]).map(namedAlias);
  const blocked=(abbreviationAliases[level.id]||[]).map(namedAlias);
  return {names:[level.answer,...aliases.filter(alias=>level.difficulty!=='medium'||!blocked.includes(alias))],blocked};
}
export function matches(level,guess) {
  if(typeof level?.answer!=='string'||typeof guess!=='string'||!['easy','medium','hard'].includes(level.difficulty)||!guess.length||guess.length>100)return false;
  if(level.difficulty==='hard')return guess===level.answer;
  const input=cleanAnswerSpaces(guess);
  if(!input||level.difficulty==='medium'&&input!==guess)return false;
  const {names:candidates,blocked}=answerOptions(level);
  if(level.difficulty==='medium'&&blocked.includes(input))return false;
  for(const candidate of candidates){
    if(input===candidate)return true;
    // A partial answer keeps the source spelling/case; its first letter is capitalized.
    if((input.match(/[a-zA-Z0-9]/g)||[]).length>=3){
      for(let start=0;start<candidate.length;start++){
        const fragment=candidate.slice(start,start+input.length);
        if(fragment.length===input.length&&initialCapital(fragment)===input)return true;
      }
    }
    if(level.difficulty==='easy'){
      const words=candidate.match(/[a-zA-Z0-9]+/g)||[];
      if(words.length>1&&input===words.map(word=>word[0]).join('').toUpperCase())return true;
    }
  }
  return false;
}
export const answerPattern = answer => answer.replace(/\p{Lu}/gu,'A').replace(/\p{Ll}/gu,'a').replace(/\p{Nd}/gu,'0');
const guidance = {
  easy:{title:'Beginner answers:',description:'Synonyms, partial answers (at least 3 letters or digits), and abbreviations are accepted. Capitalize the first word, keep abbreviations uppercase, and preserve the remaining spelling/case. Extra spaces are allowed.',placeholder:'Type an answer…'},
  medium:{title:'Moderate answers:',description:'Synonyms and partial answers (at least 3 letters or digits) are accepted. Capitalize the first word and preserve the remaining spelling/case. Use single spaces with no extra spaces. Use full names for abbreviation alternatives.',placeholder:'Type an answer…'},
  hard:{title:'Exact match only:',description:'Use the official spelling, capitalization, spaces and punctuation. No synonyms, partial answers, abbreviations or extra spaces, unless the abbreviation is the official answer.',placeholder:'Type the exact answer…'},
};
export const answerGuidance = difficulty => guidance[difficulty];
