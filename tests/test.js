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

var vows = require('vows'),
    assert = require('assert'),
    fs = require('fs'),
    gitwiki = require('../lib/gitwiki');

var NEW_REPO_PATH = 'data/new_repo';
var NEW_REPO2_PATH = 'data/new_repo2';
var STANDARD_REPO_PATH = 'data/old_repo';

var wiki = new gitwiki.GitWiki();

vows.describe('Repository').addBatch({
    'Initialize new repository Synchronously':{
        topic:function(){
            var result = wiki.initRepository(NEW_REPO_PATH);
            return result;
        },
        'Initialized new repo successfully':function(result){
            assert.isTrue(result);
            cleanDir(NEW_REPO_PATH);
        }
    },
    'Initialize new repository Asynchronously':{
        topic:function(){
            var result = wiki.initRepository(NEW_REPO2_PATH,this.callback);
        },
        'Initialized new repo successfully':function(result){
            assert.isTrue(result);
            cleanDir(NEW_REPO2_PATH);
        }
    },
    'Open repository Synchronously':{
        topic:function(){
            var result = wiki.openRepository(STANDARD_REPO_PATH);
            return result;
        },
        'Initialized new repo successfully':function(result){
            assert.isTrue(result);
        }
    },
    'Open repository Asynchronously':{
        topic:function(){
            var result = wiki.initRepository(STANDARD_REPO_PATH,this.callback);
        },
        'Initialized new repo successfully':function(result){
            assert.isTrue(result);
        }
    },

}).export(module);

function cleanDir(dir){
    var dirData = fs.readdirSync(dir);
    var stat;
    for(var i = 0,len = dirData.length;i<len;i++){
        stat = fs.statSync(dir+'/'+dirData[i]);
        if(stat.isDirectory()){
            cleanDir(dir+'/'+dirData[i]);
            fs.rmdirSync(dir+'/'+dirData[i]);
        }else{
            fs.unlinkSync(dir+'/'+dirData[i]);
        }
    }
}
