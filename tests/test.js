var gitwiki = require('../lib/gitwiki');

var REPO_PATH = '../examples/wiki';

console.log('Opening wiki repository');
var wiki = gitwiki.open(REPO_PATH);
console.log('Wiki opened successfully');

console.log('Page listing: ');
console.log(wiki.listPages());

console.log('Load page contents (FAQ):');
console.log(wiki.loadPage('FAQ'));

console.log('History of "Installation Guide" page (5 most recent changes): ');
console.log(wiki.pageHistory('installation-guide',5));

console.log('Wiki History (5 most recent changes): ');
console.log(wiki.history(5));

console.log('Compare revisions (two last commits): ');
console.log(wiki.compareRevisions('3e59fb20f25dd4d3075628145355a2f0444f07a9',
                                  '98f922bf026b550eb0dc4794fde81694b281ea82',
                                  {
                                    withContents : true
                                  }
                                 )
           );
           




