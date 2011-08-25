// Load dependencies
var gitteh = require('gitteh'),
    fs     = require('fs'),
    path   = require('path');

// Just to improve readability
var gitwiki = exports;

// Wiki engines
gitwiki.MARKDOWN = 'md';
gitwiki.TEXTILE = 'textile';

// Private functions to convert filenames to titles and vice versa.
var convertTitleToFilename = function(title){
    return title.replace(/\s/g,'-');
}

var convertFilenameToTitle = function(filename){
    return filename.replace(/\-/g,' ');
}

var merge_options = function(options,defaults){
    var result = {};
    for (attrname in defaults) { result[attrname] = defaults[attrname]; }
    for (attrname in options) { result[attrname] = options[attrname]; }
    return result;
}

/**
 * Creates a new wiki repository
 * 
 * @param {string} repoAddress
 * @param {object} options
 * @returns {Wiki}
 **/
gitwiki.createSync = function(repoAddress,options){

    throw new Error('Creating wiki is not implemented yet.');
    
    var defaults = {
        overwrite: false,
        creator: 'node-gitwiki',
        creatorEmail: 'mrtz.milani@googlemail.com'
    };
    
    options = merge_options(options,defaults);

    repoAddress = path.normalize(repoAddress);
    
    //check if there is a repository already there.
    if(! options.overwrite){
        try{
            gitteh.openRepository(path.join(repoAddress,'.git'));
            throw new Error('There is a repository in ' + repoAddress);
        }catch(e){
            if(e.gitError != gitteh.error.GIT_ENOTAREPO){
                throw e;
            }
        }
    }
    
    //initialize new repository
    try{
        var repo = gitteh.initRepository(repoAddress);
    }catch(e){
        throw e;
    }
    
    //add first commit
    var commit = {
        message: 'wiki created',
        author: {
                    name:'Name',
                    email:'email@eme.com',
                    time: new Date()
                },
        committer:{
                    name:'Name',
                    email:'email@eme.com',
                    time: new Date()
                 } 
    }
    
    return new Wiki(repo,commit.id);
}

gitwiki.create = function(repoAddress,options,callback){
    throw new Error('Not implemented yet.');
}
/**
 * Opens an existing wiki repository
 * 
 * @param {string} repoAddress
 * @param {object} options
 * @returns {Wiki}
 **/
gitwiki.openSync = function(repoAddress,options){
    
    var defaults = {
        createOnFail: false
    }
    
    options = merge_options(options,defaults);
    
    try{
        var repo = gitteh.openRepository(path.join(repoAddress,'.git'));
    }catch(e){
        if(e.gitError == gitteh.error.GIT_ENOTAREPO && options.createOnFail){
            return this.createSync(repoAddress,{overwrite:true});
        }
        throw e;
    }
    
    var headRef = repo.getReference('HEAD');
    headRef = headRef.resolve();
    
    return new Wiki(repo,headRef.target);
}

gitwiki.open = function(repoAddress,options,callback){
   
   var defaults = {
       createOnFail : false
   }
   
   if(typeof options === 'function'){
     callback = options;
     options = {};
   }
   
   options = merge_options(options,defaults);
    
   gitteh.openRepository(path.join(repoAddress,'.git'),function(err,repo){
     if(err){
        if(err.gitError == gitteh.error.GIT_ENOTAREPO && options.createOnFail){
            gitwiki.create(repoAddress,{overwrite:true},callback);
        }else{
            callback(err);
        }
     }else{

         repo.getReference('HEAD',function(err,headRef){
             headRef = headRef.resolve(function(err,headObj){
                 if(err){
                     callback(err);
                 }else{
                     var wiki = new Wiki(repo,headObj.target);
                     callback(null,wiki);
                 }
             });
         });
     }
   });
};

/**
 * Auto detect which engine to use for rendering the page
 *
 * @param {string|buffer} content
 * @returns {string}
 **/
gitwiki.detectEngine = function(content){
//this function is not implemented yet.
    var engine;
    engine = gitwiki.MARKDOWN;
    return engine;
}

/**
 * Constructor for Wiki object
 * 
 * @constructor
 * @param {Gitteh::Repository} repo
 * @param {string} headCommit
 **/
var Wiki = gitwiki.Wiki = function(repo,headCommit){
    this.repo = repo;
    this.head = headCommit;
}

/**
 * Creates a page in wiki
 * 
 * @param {string} title
 * @param {object} options
 **/
Wiki.prototype.createPageSync = function(title,options){
    
    var defaults = {
        content : null,
    }

    options = merge_options(options,defaults);
    
    fileName = convertTitleToFilename(title);

    throw new Error('Not implemented yet');
}

Wiki.prototype.createPage = function(title,options,callback){
    throw new Error('Not implemented yet');
}

/**
 * Edits a page in wiki
 * 
 * @param {string} page
 * @param {string|buffer} newContent
 **/
Wiki.prototype.editPageSync = function(page,newContent){
    throw new Error('Not implemented yet');
}

Wiki.prototype.editPage = function(page,newContent){
    throw new Error('Not implemented yet');
}

/**
 * Deletes a page from wiki
 * 
 * @param {string} page
 **/
Wiki.prototype.deletePageSync = function(page){
    throw new Error('Not implemented yet');
}

Wiki.prototype.deletePage = function(page){
    throw new Error('Not implemented yet');
}

/**
 * Loads page content
 * 
 * @param {string} page
 * @param {string} commitId
 * @returns {object}
 **/
Wiki.prototype.loadPageSync = function(page,options){
    
    var defaults = {
        commitId: null,
        renderPage: true
    }
    
    options = merge_options(options,defaults);
    
    var fileName = convertTitleToFilename(page);
    
    if(!options.commitId){
        var indexObj = this.repo.getIndex();
        page = indexObj.findEntry(fileName);
        page.id = page.oid;
    }else{
        var commitObj = this.repo.getCommit(options.commitId);
        var treeObj = this.repo.getTree(commitObj.tree);
        var page = treeObj.entries.filter(function(element){
                                return (element.name == fileName);
                           }).pop();
    }
    
    var content = this.repo.getBlob(page.id).data;
    
    if(options.renderPage){
        content = this.render(content);
    }
    
    page = {
        content: content,
        lastEdit: page.mtime || null
    } 
    return page;
}

Wiki.prototype.loadPage = function(page,options,callback){

    var defaults = {
        commitId : null,
        renderPage : true
    }

    if(typeof options === 'function'){
        callback = options;
        options = {};
    }
    
    options = merge_options(options,defaults);

    var fileName = convertTitleToFilename(page);

    var repo = this.repo;
    var render = this.render;

    var fetchContent = function(err,blob){
        if(err){
            callback(err);
            return;
        }
        var content = blob.data;
        if(options.renderPage){
            content = render(content);
        }
        callback(null,content);
    }

    if(!options.commitId){
        repo.getIndex(function(err,indexObj){
            if(err){
                callback(err);
                return;
            }
            indexObj.findEntry(fileName,function(err,page){
                if(err){
                  callback(err);
                  return;
                }
                repo.getBlob(page.oid,fetchContent);
            });
        });
    }else{
        repo.getCommit(options.commitId,function(err,commitObj){
            if(err){
                callback(err);
                return;
            }
            repo.getTree(commitObj.tree,function(err,treeObj){
                if(err){
                    callback(err);
                    return;
                }
                var page = treeObj.entries.filter(function(element){
                                return (element.name == fileName);
                           }).pop();
                repo.getBlob(page.id,fetchContent);
            });
        });
    }
}

/**
 * Returns history of a page
 * 
 * @param {string} page
 * @param {int} depth
 * @returns {array}
 **/
Wiki.prototype.pageHistorySync = function(page,depth){
    var walker = this.repo.createWalker();
    walker.sort(gitteh.GIT_SORT_TIME);
    walker.push(this.head);
    
    depth = depth || Infinity;
    page = convertTitleToFilename(page)
    
    var history = [];
    var commit;
    var pageLastId = 0;
    var pageId;
    var treeObj;
    var pageEntry;
    
    while((commit = walker.next()) && (0 < depth--)) {
    
        treeObj = this.repo.getTree(commit.tree);
        
        pageEntry = treeObj.entries.filter(function(elem){
            return (elem.name == page)
        }).pop();
        
        if(pageEntry == undefined) break;
        
        pageId = pageEntry.id;
        
        if(pageId != pageLastId){

            pageLastId = pageId;
            
            history.push(
                {
                    commit: commit.id,
                    author: commit.author.name,
                    email : commit.author.email,
                    date:   commit.author.time,
                    message: commit.message,
                }
            );
        }
    }
    return history;
}

Wiki.prototype.pageHistory = function(page,depth,callback){

    var pageEntry,pageId;

    var history    = [];
    var pageLastId = 0;
    var repo       = this.repo;
    var head       = this.head;
    var walker     = repo.createWalker();
    
    if(typeof depth === 'function'){
        callback = depth;
        depth = null;
    }
    
    //@TODO find an upper bound for depth. there is heap limits.
    depth          = depth || Infinity;
    page           = convertTitleToFilename(page);

    var diveIntoHistory = function(err,commit){
        if(err){
            callback(err);
            return;
        }

        if(depth < 0 || commit == null){
            callback(null,history);
            return;
        }

        depth--;

        repo.getTree(commit.tree,function(err,treeObj){

          if(err){
              callback(err);
              return;
          }

          pageEntry = treeObj.entries.filter(function(elem){
              return (elem.name == page);
          }).pop();

          if(!pageEntry){
              callback(null,history);
              return;
          }

          pageId = pageEntry.id;
          if(pageId != pageLastId){
              pageLastId = pageId;
              history.push({
                commit  : commit.id,
                author  : commit.author.name,
                email   : commit.author.time,
                message : commit.message
              });
          }
          //@FIXME there is a bug in gitteh when next calling async.
          //walker.next(diveIntoHistory);

          var next = walker.next();
          diveIntoHistory(null,next);
        });
    }

    walker.sort(gitteh.GIT_SORT_TIME,function(err){
        if(err){
          callback(err);
          return;
        }
        walker.push(head,function(err){
            if(err){
                callback(err);
                return;
            }
            walker.next(diveIntoHistory);
        });
    });
}

/**
 * Lists pages in wiki
 * 
 * @param {string} commitId
 * @returns {array}
 **/
Wiki.prototype.listPagesSync = function(commitId){
    var pages = [];
    var entry;
    
    if(!commitId){
        var indexObj = this.repo.getIndex();
        
        for(var i = 0; i < indexObj.entryCount; i++){
            entry = indexObj.getEntry(i);

            if(entry.mode != 33188) continue;
            
            pages.push({
                lastEdit : entry.mtime,
                name: convertFilenameToTitle(entry.path)
            });
        }
    }else{
        var commitObj = this.repo.getCommit(commitId);
        var treeObj = this.repo.getTree(commitObj.tree);

        for(var i = 0,len = treeObj.entries.length; i < len; i++){
            entry = treeObj.entries[i];

            if(entry.attributes !== 33188) continue;
            
            pages.push({
                lastEdit: null,
                name: convertFilenameToTitle(entry.name)
            });
        }
    }
    return pages;
}

Wiki.prototype.listPages = function(options,callback){

    var defaults = {
        commitId : null,
        withContents : false,
        start : 0,
        count : Infinity
    }

    var pages = [];
    var repo = this.repo;
    var entry;
    var count;

    if(typeof options === 'function'){
        callback = options;
        options = {};
    }

    options = merge_options(options,defaults);

    //use index object instead of commit object where possible,
    //it is much faster
    if(!options.commitId){
        repo.getIndex(function(err,indexObj){
            if(err){
                callback(err);
                return;
            }

            count = Math.min(indexObj.entryCount,options.count);

            for(var i = options.start; i < count; i++){
                entry = indexObj.getEntry(i);

                if(entry.mode != 33188) continue;

                if(options.withContent){
                    entry.content = repo.getBlob(entry.id).data;
                }else{
                    entry.content = null;
                }
                pages.push({
                    lastEdit : entry.mtime,
                    name: convertFilenameToTitle(entry.path)
                });
            }
            callback(null,pages);
            return;
        });
    }else{
        repo.getCommit(commitId,function(err,commitObj){
            if(err){
                callback(err);
                return;
            }
            repo.getTree(commitObj.tree,function(err,treeObj){
                if(err){
                    callback(err);
                    return;
                }

                count = Math.min(treeObj.entries.length,options.count);

                for(var i = options.start,len = count; i < len; i++){
                    entry = treeObj.entries[i];

                    if(entry.attributes !== 33188) continue;

                    pages.push({
                        lastEdit: null,
                        name: convertFilenameToTitle(entry.name)
                    });
                }
                callback(null,pages);
                return;
            });
        });
    }
}

/**
 * Compares two commits to find changes
 * 
 * @param {string} firstCommit
 * @param {string} secondCommit
 * @param {object} options
 * @returns {array}
 **/
Wiki.prototype.compareRevisionsSync = function(firstCommit,secondCommit,options){
    var defaults = {
        fileName: null,
        withContents: false
    }
    var revisions = [];

    options = merge_options(options,defaults);

    options.fileName = (options.fileName != null)?convertTitleToFilename(options.fileName): null;

    var firstCommitObj = this.repo.getCommit(firstCommit);
    var fEntries = this.repo.getTree(firstCommitObj.tree).entries;

    var secondCommitObj = this.repo.getCommit(secondCommit);
    var sEntries = this.repo.getTree(secondCommitObj.tree).entries;

    if(options.fileName){
        fEntry = fEntries.filter(function(elem){
            return (elem.name == options.fileName);
        }).pop();
        sEntry = sEntries.filter(function(elem){
            return (elem.name == options.fileName);
        }).pop();

        if(fEntry == undefined && sEntry == undefined){
            return []
        }

        if((fEntry || sEntry) != undefined || (fEntry.id != sEntry.id)){
            return [{first:fEntry,second:sEntry}];
        }
    }

    //@TODO use a better alogrithm. there should be an algorithm with O(n) out there.
    var flag = false;
    for(var i = 0, fLength = fEntries.length; i < fLength ; i++){
        for(var j = 0, sLength = sEntries.length; j < sLength; j++){
            if(fEntries[i].id == sEntries[j].id){
                fEntries.splice(i,1);
                sEntries.splice(j,1);
                i--;
                fLength--;
                flag = true;
                break;
            }else if(fEntries[i].name == sEntries[j].name){
                if(options.withContents){
                    fEntries[i].content = this.repo.getBlob(fEntries[i].id).data
                    sEntries[j].content = this.repo.getBlob(sEntries[j].id).data
                }
                fEntries[i].name = convertFilenameToTitle(fEntries[i].name);
                sEntries[j].name = convertFilenameToTitle(sEntries[j].name);
                revisions.push({
                    first:fEntries[i],
                    second:sEntries[j]
                });
                fEntries.splice(i,1);
                sEntries.splice(j,1);
                i--;
                fLength--;
                flag = true;
                break;
            }
        }
        if(!flag){
            fEntries[i].name = convertFilenameToTitle(fEntries[i].name);
            if(options.withContents){
                    fEntries[i].content = this.repo.getBlob(fEntries[i].id).data
            }
            revisions.push({
                first:fEntries[i],
                second:null
            });
        }else{
            flag = false;
        }
    }
    sEntries.forEach(function(sElem){
        sElem.name = convertFilenameToTitle(sElem.name);
        if(options.withContents){
            sElem.content = this.repo.getBlob(sElem.id).data
        }
        revisions.push({
            first:null,
            second:sElem
        });
    });

    return revisions;
}

Wiki.prototype.compareRevisions = function(firstCommit,secondCommit,options,callback){
    var defaults = {
        fileName: null,
        withContents: false
    }
    var revisions = [];
    var repo = this.repo;
    var fEntries;
    var sEntries;

    if(typeof options === 'function'){
        callback = options;
        options = {};
    }
    options = merge_options(options,defaults);
    
    options.fileName = (options.fileName != null)?convertTitleToFilename(options.fileName): null;
    
    var processRevisions = function(){
        if(!fEntries || !sEntries)
            return;
        if(options.fileName){
            fEntry = fEntries.filter(function(elem){
                return (elem.name == options.fileName);
            }).pop();
            sEntry = sEntries.filter(function(elem){
                return (elem.name == options.fileName);
            }).pop();
            
            if(fEntry == undefined && sEntry == undefined){
                return []
            }
            
            if((fEntry || sEntry) != undefined || (fEntry.id != sEntry.id)){
                return [{first:fEntry,second:sEntry}];
            }
        }
        
        //@TODO use a better alogrithm. there should be an algorithm with O(n) out there.
        var flag = false;
        for(var i = 0, fLength = fEntries.length; i < fLength ; i++){
            for(var j = 0, sLength = sEntries.length; j < sLength; j++){
                if(fEntries[i].id == sEntries[j].id){
                    fEntries.splice(i,1);
                    sEntries.splice(j,1);
                    i--;
                    fLength--;
                    flag = true;
                    break;
                }else if(fEntries[i].name == sEntries[j].name){
                    if(options.withContents){
                        fEntries[i].content = this.repo.getBlob(fEntries[i].id).data
                        sEntries[j].content = this.repo.getBlob(sEntries[j].id).data
                    }
                    fEntries[i].name = convertFilenameToTitle(fEntries[i].name);
                    sEntries[j].name = convertFilenameToTitle(sEntries[j].name);
                    revisions.push({
                        first:fEntries[i],
                        second:sEntries[j]
                    });
                    fEntries.splice(i,1);
                    sEntries.splice(j,1);
                    i--;
                    fLength--;
                    flag = true;
                    break;
                }
            }
            if(!flag){
                fEntries[i].name = convertFilenameToTitle(fEntries[i].name);
                if(options.withContents){
                        fEntries[i].content = this.repo.getBlob(fEntries[i].id).data
                }
                revisions.push({
                    first:fEntries[i],
                    second:null
                });
            }else{
                flag = false;
            }
        }
        sEntries.forEach(function(sElem){
            sElem.name = convertFilenameToTitle(sElem.name);
            if(options.withContents){
                sElem.content = this.repo.getBlob(sElem.id).data
            }
            revisions.push({
                first:null,
                second:sElem
            });
        });
        callback(null,revisions);
    }

    var getEntries = function(commit,commitNumber){
        repo.getCommit(commit,function(err,commitObj){
            if(err){
                callback(err);
                return;
            }
            repo.getTree(commitObj.tree,function(err,treeObj){
                if(err){
                    callback(err);
                    return;
                }
                if(commitNumber == 1)
                    fEntries = treeObj.entries;
                else
                    sEntries = treeObj.entries;
                processRevisions();
            })
        })        
    }
    
    getEntries(firstCommit,1);
    getEntries(secondCommit,2);
}

/**
 * Reverts changes made to a page in a commit
 * 
 * @param {string} page
 * @param {string} commitId
 **/
Wiki.prototype.revertChangesSync = function(page,commitId){
    throw new Error('Not implemented yet');
}

Wiki.prototype.revertChanges = function(page,commitId){
    throw new Error('Not implemented yet');
}

/**
 * returns history of the wiki
 * 
 * @param {int} depth
 * @returns {array}
 **/
Wiki.prototype.historySync = function(depth){

    if(!depth){
        depth = Infinity;
    }

    var walker = this.repo.createWalker();
    walker.sort(gitteh.GIT_SORT_TIME);
    walker.push(this.head);
    
    var history = [];
    var commit;
    while( (commit = walker.next()) && depth-- > 0) {
        history.push(
            {
                commit: commit.id,
                author: commit.author.name,
                email : commit.author.email,
                date:   commit.author.time,
                message: commit.message,
            }
        );
    }
    return history;
}

Wiki.prototype.history = function(depth,callback){
    
    var repo = this.repo;
    var head = this.head;
    var history = [];
    var walker = repo.createWalker();

    if(typeof depth === 'function'){
        callback = depth;
        depth = null;
    }

    //@TODO Find an upper bound for depth
    depth = depth || Infinity;
    
    var diveIntoHistory = function(err,commit){

        if( depth == 0 || commit == null ){
            callback(null,history);
            return;
        }
        depth--;
        history.push({
            commit : commit.id,
            author : commit.author.name,
            email : commit.author.email,
            date : commit.author.time,
            message : commit.message
        });
        //@FIXME there is an issue when calling walker.next async.
        //walker.next(diveIntoHistory);
        var next = walker.next();
        diveIntoHistory(null,next);
    }

    walker.sort(gitteh.GIT_SORT_TIME,function(err){
        if(err){
            callback(err);
            return;
        }

        walker.push(head,function(err){
            if(err){
                callback(err);
                return;
            }
            walker.next(diveIntoHistory);
        });
    });
}

/**
 * Closes a wiki
 *
 **/
Wiki.prototype.close = function(){
}

/**
 * Render a page with corresponding engine
 *
 * @param {string|buffer} content
 * @returns {string}
 */
Wiki.prototype.render = gitwiki.render = function(content){
    var engineName = gitwiki.detectEngine(content);
    return require('./engines/'+engineName+'.js').render(content);
}
