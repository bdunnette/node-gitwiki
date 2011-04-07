/*
 * The MIT License
 *
 * Copyright (c) 2011 Morteza Milani
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
var path = require('path'),
    fs = require('fs'),
    gitteh = require('gitteh');

var options = {
    repositoryPath : 'wiki'
};

function GitWiki(userOptions){

    this.repo = null;
    this.repoReady = false;
    this.repoRefs = null;
    this.repoRefsUpdate = true;
    
    userOptions = userOptions || {};
    
    options = merge(options,userOptions);
    
    if(typeof options.repositoryPath != 'string') throw new Error('Repository Path is invallid');
    options.repositoryPath = path.normalize(options.repositoryPath);
    
    var thisObj = this;
    this.repoRefs = {
        refs: [],
        tags: [],
        commitMap: [],
        needsUpdate:true,
        get: function(repo,key,callback){
            if(!repo) return callback(new Error('Repository is not Ready'));
            if(typeof key != 'string' || key === '') return callback(new Error('Reference name is empty'));
            var fn = function(err){
                if(err) return callback(err);
                if(this.commitMap[key]) return callback(null,this.commitMap[key]);
                var self = this;
                var obj = this.refs[key];
                if(obj !== undefined && obj.target === null){
                    repo.getReference(obj.name,function(err,newObj){
                        if(obj.refType == 'tags'){
                            var tagData = repo.getTag(newObj.target);
                            self.commitMap[key] = tagData.targetId;
                            self.refs[key] = newObj;
                            self.tags[key] = tagData;
                            callback(err,tagData.targetId);
                        }else{
                            self.refs[key] = newObj;
                            self.commitMap[key] = newObj.target;
                            callback(err,newObj.target);
                        }
                    });
                } else if(obj === undefined) {
                    repo.getReference(key,function(err,newObj){
                        if(err) return callback(err);
                        if(newObj.name=='HEAD') {
                            var tmpStr = newObj.target.replace('refs/','');

                            var tmpIndex = tmpStr.indexOf('/');
                            var type = tmpStr.substring(0,tmpIndex);
                            var newKey;
                            switch(type){
                                case 'remotes':
                                    newKey = tmpStr.replace('remotes/','');
                                    break;
                                case 'tags':
                                case 'heads':
                                    tmpIndex = tmpStr.lastIndexOf('/');
                                    newKey = tmpStr.substring(tmpIndex+1);
                                    break;
                            }
                            if(self.refs[newKey] !== undefined){
                                self.refs[key] = self.refs[newKey];
                                self.get(repo,self.refs[newKey].name,callback);
                            }else{
                                callback(new Error('Reference not found'));
                            }
                        }else{
                            self.refs[key] = newObj;
                            callback(err,newObj.target);
                        }
                    });
                }
            };
            if(this.needsUpdate){
                this.buildRefs(repo,fn);
            }else{
                fn.apply(this);
            }
        },
        buildRefs: function(repo,callback){
            var self = this;
            
            var fn = function(err,allRefs){
                var tmpStr;
                var tmpIndex;
                var key;
                var type;

                if(err) return callback.apply(self,err);

                for(var i = 0, len = allRefs.length; i < len; i++){
            
                    tmpStr = allRefs[i].replace('refs/','');

                    tmpIndex = tmpStr.indexOf('/');
                    type = tmpStr.substring(0,tmpIndex);
                    
                    switch(type){
                        case 'remotes':
                            key = tmpStr.replace('remotes/','');
                            break;
                        case 'tags':
                        case 'heads':
                            tmpIndex = tmpStr.lastIndexOf('/');
                            key = tmpStr.substring(tmpIndex+1);
                            break;
                    }
                    
                    self.refs[key] = {name:allRefs[i],refType:type,target:null};
                }
                self.needsUpdate = false;
                return callback.apply(self);
            };
            repo.listReferences(255,fn);
        }
    }
    
    return this; 
}

exports.GitWiki = GitWiki;

GitWiki.prototype.openRepository = function(repositoryPath,callback){
    var self = this;
    var callback2 = null;

    if(typeof repositoryPath == 'string') options.repositoryPath = path.normalize(repositoryPath);
    else if(typeof repositoryPath == 'function') callback2 = repositoryPath;
    if(typeof repositoryPath == 'string' && typeof callback == 'function') callback2 = callback;
    
    if(callback2){
        gitteh.openRepository(options.repositoryPath,function(err,repo){
            if(err) return callback2(err);
            
            self.repo = repo;
            self.repoReady = true;
            callback2(null,true);
        });
    }else{
        var repo = gitteh.openRepository(options.repositoryPath);
        self.repo = repo;
        self.repoReady = true;
        return true;
    }
}

GitWiki.prototype.initRepository = function(repositoryPath,callback){
    var self = this;
    var callback2 = null;

    if(typeof repositoryPath == 'string') options.repositoryPath = path.normalize(repositoryPath);
    else if(typeof repositoryPath == 'function') callback2 = repositoryPath;
    if(typeof repositoryPath == 'string' && typeof callback == 'function') callback2 = callback;
    
    if(callback2){
        gitteh.initRepository(options.repositoryPath,true,function(err,repo){
            if(err) return callback2(err);

            self.repo = repo;
            self.repoReady = true;
            try{
                var newCommit = repo.createCommit();
                var newTree = repo.createTree();
                var newFile = repo.createRawObject();

                newFile.type = 'blob';
                newFile.data = new Buffer('');
                newFile.save();
                newTree.addEntry(newFile.id,'.empty',33188);
                newTree.save();
                
                newCommit.setTree(newTree.id);
                newCommit.author = newCommit.committer = {
                    name: 'Node GitWikiWiki',
                    email: 'mrtz.milani@googlemail.com',
                    time: new Date()
                };
                newCommit.message = 'Initial Commit';
                newCommit.save();            
            
                var reference = repo.createOidReference('refs/heads/master',newCommit.id);
                
                callback2(null,true);
            }catch(e){
                callback2(e);
            }
        });
    }else{
        var repo = gitteh.initRepository(options.repositoryPath,true);
        self.repo = repo;
        var newCommit = repo.createCommit();
        var newTree = repo.createTree();
        var newFile = repo.createRawObject();

        newFile.type = 'blob';
        newFile.data = new Buffer('');
        newFile.save();
        newTree.addEntry(newFile.id,'.empty',33188);
        newTree.save();
                
        newCommit.setTree(newTree.id);
        newCommit.author = newCommit.committer = {
            name: 'Node GitWikiWiki',
            email: 'mrtz.milani@googlemail.com',
            time: new Date()
        };
        newCommit.message = 'Initial Commit';
        newCommit.save();            
            
        var reference = repo.createOidReference('refs/heads/master',newCommit.id);

        self.repoReady = true;
        
        return true;
    }
}

GitWiki.prototype.readFile = function(resourcePath,ref,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    this.traversePath(resourcePath,ref,function(err,pathObjects){
        if(err) return callback(err);
        callback(null,pathObjects[0].rawObj.data);
    });
}

// start is the index of the file, limit is the number of files to read.
GitWiki.prototype.readFiles = function(directory,ref,start,limit,callback){
    
    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    if(arguments.length == 3){
        callback = start;
        start = 0;
        limit = -1;
    }
    if(arguments.length == 4){
        callback = limit;
        limit = -1;
    }
    
    var repo = this.repo;
    this.traversePath(directory,ref,function(err,pathObjects){
       if(err) return callback(err);
       if(pathObjects[0].type != 'tree' && pathObjects[0].type !='commitTree') return callback(new Error('"' + directory + '" is not a directory'));
       
        var entryCount = pathObjects[0].obj.entryCount;
        if(entryCount < start) return callback(new Error('Start index out of range'));
        if(limit == -1) limit = entryCount;
        else limit += start + 1;
        
        var tree = pathObjects[0].treeObj;
        var files = [];
        var readingFilesErr = false;
        
        for(var i = start; i < entryCount && i < limit; i++){
            try{
                var entry = tree.getEntry(i);
                if(entry.attributes == 33188){
                    file = repo.getRawObject(entry.id);
                    files.push({id:entry.id,name:entry.filename,data:file.data});
                }
            }catch(e){
                readingFilesErr = e;
                break;
            }
        }
        if(readingFilesErr == false){
            return callback(null,files);
        }else{
            return callback(readingFilesErr);
        }
    });
}

//listDirectories = true => list directory names, listFiles = true => list file names
GitWiki.prototype.readDirectory = function(directory,ref,listDirectories,listFiles,callback){
    
    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    if(arguments.length == 3){
        callback = listDirectories;
        listDirectories = true;
        listFiles = true;
    }

    if(listDirectories == false && listFiles == false){
        return callback(new Error('You should at least enable listing directories or files.'));
    }
    
    var repo = this.repo;
    this.traversePath(directory,ref,function(err,pathObjects){
       if(err) return callback(err);
       if(pathObjects[0].type != 'tree' && pathObjects[0].type !='commitTree') return callback(new Error('"' + directory + '" is not a directory'));
       
        var entryCount = pathObjects[0].obj.entryCount;
        var tree = pathObjects[0].treeObj;
        
        var files = [];
        var readingFilesErr = false;
        
        for(var i = 0; i < entryCount; i++){
            try{
                var entry = tree.getEntry(i);
                var type = (entry.attributes==33188)?'file':'dir';
                if( type == 'file' && !listingFiles) continue;
                else if(type == 'dir' && !listingDirectories) continue;
                files.push({id:entry.id,name:entry.filename,type:type});
            }catch(e){
                readingFilesErr = e;
                break;
            }
        }
        if(readingFilesErr == false){
            return callback(null,files);
        }else{
            return callback(readingFilesErr);
        }
    });
}

// commiter = {name:'',email:''}
GitWiki.prototype.editFile = function(resourcePath,ref,data,commiter,callback){

    if(typeof data != 'string') return callback(new Error('Editing file needs a string as data parameter'));
    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    
    this.traversePath(resourcePath,ref,function(err,pathObjects){
        if(err) return callback(err);
        
        var entry;
        var preEntry;
        for(var i =0 ,len = pathObjects.length; i < len;i++){
            entry = pathObjects[i];
            switch(entry.type){
                case 'blob':
                    entry.rawObj.data = new Buffer(data);
                    entry.rawObj.save();
                    entry.obj.id = entry.rawObj.id;
                    break;
                case 'tree':
                case 'commitTree':
                    preEntry = pathObjects[i-1];
                    entry.treeObj.removeEntry(preEntry.name);
                    entry.treeObj.addEntry(preEntry.obj.id,preEntry.name,preEntry.obj.attributes);
                    entry.treeObj.save();
                    entry.obj.id = entry.treeObj.id;
                    break;
                case 'commit':
                    preEntry = pathObjects[i-1];
                    
                    var newCommit = repo.createCommit();
                    newCommit.author = newCommit.committer = {
                        name: commiter.name,
                        email: commiter.email,
                        time: new Date()
                    };
                    newCommit.message = resourcePath + ' edited';
                    newCommit.setTree(preEntry.treeObj.id);
                    newCommit.addParent(entry.obj);
                    newCommit.save();
            }
            pathObjects[i] = entry;
        }
        
        callback(null,pathObjects[0]);
    });
};

//file = {name:,data:,attributes:,overwrite:}
//commiter = {name:,email:}
GitWiki.prototype.createFile = function(directory,ref,file,commiter,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;

    if(typeof file.name != 'string' || file.name === '') return callback(new Error('File name is empty'));
    if(typeof file.data != 'string') return callback(new Error('File data should be string'));
    file.attributes = file.attributes || 33188;
    file.overwrite = file.overwrite || false;
    
    this.traversePath(directory,ref,function(err,pathObjects){
        if(err) return callback(err);
        if(pathObjects[0].type != 'tree' && pathObjects[0].type !='commitTree') return callback(new Error('Returned entry is not a tree'));

        pathObjects[0].treeObj.getEntry(file.name,function(err,hasEntry){
            if(hasEntry && !file.overwrite){
                return callback(new Error('File already exists'));
            }
            
            var newBlob = repo.createRawObject();
                newBlob.data = new Buffer(file.data);
                newBlob.type = 'blob';
                newBlob.save();
                   
                pathObjects[0].treeObj.addEntry(newBlob.id,file.name,file.attributes);
                pathObjects[0].treeObj.save()
                pathObjects[0].obj.id = pathObjects[0].treeObj.id;

                for(var i =1 ,len = pathObjects.length; i < len;i++){
                    entry = pathObjects[i];
                    switch(entry.type){
                        case 'tree':
                        case 'commitTree':
                            preEntry = pathObjects[i-1];
                            entry.treeObj.removeEntry(preEntry.name);
                            entry.treeObj.addEntry(preEntry.obj.id,preEntry.name,preEntry.obj.attributes);
                            entry.treeObj.save();
                            entry.obj.id = entry.treeObj.id;
                            break;
                        case 'commit':
                            preEntry = pathObjects[i-1];
                                
                            var newCommit = repo.createCommit();
                            newCommit.author = newCommit.committer = {
                                name: commiter.name,
                                email: commiter.email,
                                time:new Date()
                            };
                            newCommit.message = path.normalize(directory + '/' + file.name) + ' created';
                            newCommit.setTree(preEntry.treeObj.id);
                            newCommit.addParent(entry.obj);
                            newCommit.save();
                    }
                    pathObjects[i] = entry;
                }
                    
                callback(null,pathObjects[0]);
        });
    });
};

GitWiki.prototype.deleteFile = function(resourcePath,ref,commiter,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    this.traversePath(resourcePath,ref,function(err,pathObjects){
        if(err) return callback(err);
        if(pathObjects[0].rawObj.type != 'blob') return callback(new Error('File does not exists'));
        
        pathObjects[1].treeObj.removeEntry(pathObjects[0].name);
        pathObjects[1].treeObj.save();
        pathObjects[1].obj.id = pathObjects[1].treeObj.id;
        
        for(var i =2 ,len = pathObjects.length; i < len;i++){
            entry = pathObjects[i];
            switch(entry.type){
                case 'tree':
                case 'commitTree':
                    preEntry = pathObjects[i-1];
                    entry.treeObj.removeEntry(preEntry.name);
                    entry.treeObj.addEntry(preEntry.obj.id,preEntry.name,preEntry.obj.attributes);
                    entry.treeObj.save();
                    entry.obj.id = entry.treeObj.id;
                    break;
                case 'commit':
                    preEntry = pathObjects[i-1];
                    
                    var newCommit = repo.createCommit();
                    newCommit.author = newCommit.committer = {
                        name: commiter.name,
                        email: commiter.email,
                        time:new Date()
                    };
                    newCommit.message = resourcePath + ' removed';
                    newCommit.setTree(preEntry.treeObj.id);
                    newCommit.addParent(entry.obj);
                    newCommit.save();
                    break;
            }
            pathObjects[i] = entry;
        }
        callback(null,pathObjects[0]);
    });
}

GitWiki.prototype.getFileHistory = function(resourcePath,ref,sortType,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    var self = this;
    
    return callback(new Error('Not supported yet'));
    
    this.getWalker(ref,sortType,function(err,walker){
        if(err) return callback(err);
        var commit;
        var msg;
        var history = [];
        // Randomly generates Logic Error 
        while(commit = walker.next()){
            msg = commit.message; 
            if(typeof msg == 'string' && msg.search('demo') !== -1){
                self.readFile(resourcePath,commit.id,function(err,data){
                    if(err) return callback(err);
                    history.push({commit:commit,file:data});
                });
            }
        }
        
        callback(null,history);
    });
    
}

GitWiki.prototype.getCommit = function(ref,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    var self = this;
    
    this.resolveRef(ref, function(err,commitHash){
        if(err){
            if(err.gitError && err.gitError == gitteh.error.GIT_ENOTFOUND)
                return repo.getCommit(ref,callback)
            else
                return callback(err);
        }
        repo.getCommit(commitHash,callback);
    });
}

GitWiki.prototype.resolveRef = function(key,callback){
    if(!this.repoReady) return callback(new Error('Repository is not Ready'));
    if(typeof key != 'string' || key === '') return callback(new Error('Reference name is empty'));
    repo = this.repo;

    this.repoRefs.get(repo,key,callback)
}


GitWiki.prototype.getWalker = function(ref,sortType,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    
    this.getCommit(ref,function(err,commit){
        if(err) return callback(err);
        
        repo.createWalker(function(err,walker){
            if(err) return callback(err);
            walker.sort(sortType,function(err,sorted){
                if(err) return callback(err);
                walker.push(commit,function(err,result){
                    if(err) return callback(err);
                    
                    if(!result) return callback(new Error('could not push commit into walker'));
                    callback(null,walker);
                });
            });
        });
    });

}

GitWiki.prototype.traversePath = function(resourcePath,ref,callback){

    if(!this.repoReady) return callback(new Error('No Repository Opened'));
    
    var repo = this.repo;
    var pathObjects = [];

    resourcePath = path.normalize(resourcePath).split('/');
    if(resourcePath.length === 0) return callback(new Error('Resource path is invalid : "' + resourcePath + '"'));

    this.getCommit(ref,function(err,commit){
        if(err) return callback(err);
        pathObjects.unshift({type:'commit',obj:commit});

        commit.getTree(function(err,tree){
            if(err) return callback(err);
            pathObjects.unshift({type:'commitTree',obj:tree,treeObj:tree});
            if(resourcePath[0] == '.') return callback(null,pathObjects);
            traversePath(repo,tree,resourcePath,pathObjects,callback);
        });
    });
    
}

function traversePath(repo,tree,parts,pathObjects,callback){
    var thisPart = parts.shift();
    var isLastPart = parts.length === 0;
    tree.getEntry(thisPart,function(err,entry){
        if(err) return callback(err);
        repo.getTree(entry.id,function(err,entryTree){
            //if entry is not tree but a blob
            if (err) {
                if (err.gitError === gitteh.error.GIT_EINVALIDTYPE){
                    repo.getRawObject(entry.id,function(err,rawObj){
                        if(err) return callback(err);

                        if(rawObj.type != 'blob' || rawObj.type == 'blob' && isLastPart == false)
                            return callback(new Error('Traverese Path failed: path invalid'));
                        
                        pathObjects.unshift({type:'blob',name:thisPart,obj:entry,rawObj:rawObj});
                        return callback(null,pathObjects);
                    });
                } else {
                    return callback(err);
                }
            }else{
                pathObjects.unshift({type:'tree',name:entry.filename,obj:entry,treeObj:entryTree});
                if(!isLastPart){
                    traversePath(repo,entryTree,parts,pathObjects,callback);
                }else{
                    callback(null,pathObjects);
                }
            }
        });
        
    });
}

function merge(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

