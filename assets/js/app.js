/*
 _        _         _            
| \      (_)       | |           
| |       _  ____  | |  _   ___  
| |      | ||  _ \ | |_/ ) / _ \ 
| |_____ | || | | ||  _ ( | (_) |
\_______)|_||_| |_||_| \_) \___/ 

*/

(function(){ // I <3 Closure
'use strict';

var DEBUG = true;


const Config = require('electron-config');
const config = new Config();
const {dialog} = require('electron').remote;
var fs = require('fs'); // Load the File System to execute our common tasks (CRUD)

require('electron-context-menu')();


var app = angular.module('app', ['ngMaterial', 'ngAnimate', 'ngFileUpload', 'ngAria', 'ngMessages', 'angularResizable', 'ng.deviceDetector', 'ui.ace']);

app.constant('DEBUG', DEBUG);
app.constant('dropzoneclass', 'drop-box');
app.constant('filext', 'adg');

app.config(function($mdThemingProvider) {
	/*var asphalt = $mdThemingProvider.extendPalette('blue', {
	    '500': '17395F',
	    '300': '295280',
	    '800': '112133',
	  });
	$mdThemingProvider.definePalette('asphalt', asphalt);
	$mdThemingProvider.theme('default').primaryPalette('asphalt');*/
	
	$mdThemingProvider.theme('default')
	    .primaryPalette('blue-grey')
	    .accentPalette('teal')
	    .warnPalette('red')
	    .backgroundPalette('blue-grey')
	    .dark();

    _.mixin(s.exports());
    moment.locale('it');
});

app.controller('appCtrl', function($scope, $mdDialog, $sce, $mdToast, $interval, $http, DEBUG, dropzoneclass, filext, $timeout, $mdSidenav, $log, $mdMedia, deviceDetector){
	var vm = this;
	/////////////////////////////////////
	////////////// CTRL VARS ////////////
	/////////////////////////////////////

	if(config.get('autosave') === undefined)
		config.set('autosave', true);

	if(config.get('autotime') === undefined)
		config.set('autotime', 5);

	vm.config = {
		unsaved: false,
		saving: false,
		autosave: config.get('autosave'),
		autotime: config.get('autotime') //minutes
	};

	var timingsave;

	vm.page = {
		initpage : 1,
		newapi   : 0,
		editapi  : 0
	};

	vm.subpage = {
		editpro  : 0,
		editsrv  : 0,
		editbase : 0
	};

	vm.deviceDetector = deviceDetector;

	vm.navbarClass = 2;// 3=ico+text   2=text   1=ico

	vm.content_type_req = ['text', 'xml', 'json', 'form'];
	vm.content_type_res = ['text', 'xml', 'json'];
	vm.method_list = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'TRACE', 'HEAD'];

	vm.filePath = '';
	vm.fileObj = '';
	vm.formTmp = {};
	vm.formIdsTmp = [];

	vm.formDefault = {
		project: {
			name          : '',
			description   : '',
			mime_request  : 'json',
			mime_response : 'json'
		},
		bases: []
	};

	vm.formTest = {
		project: {
			name          : 'Name of project',
			description   : 'project description',
			mime_request  : 'json',
			mime_response : 'json'
		},
		bases: [
			{
				name: 'http://test.io/service',
				description: '',
				paths: [
					{
						name:'/action',
						description: '',
						services: [
							{
								path:'/action',
								name:'Manage actions',
								description: '',
								method: 'POST',
								headers: [
									{name:'token', desc:'Id token'},
									{name:'user', desc:'id user'}
								],
								query: [
									{name:'namequno', desc:'descquno'},
									{name:'nameqdue', desc:'descqdue'}
								],
								form: [
									{name:'namefuno', desc:'descfuno'},
									{name:'namefdue', desc:'descfdue'}
								],
								body: 'test',
								type: 'json',
								responses: [
									{code:'200', body:'', type:'json', desc:''},
									{code:'404', body:'', type:'json', desc:''},
									{code:'405', body:'', type:'json', desc:''}
								]
							}
						]
					}
				]
			}
		]
	};

	vm.form = angular.copy(vm.formTest);

	//form
	//{name:'nameuno', type:'typeuno', desc:'descuno'}

	//json, xml, text
	//	free - example json:
	//		{
	//			id: 'int',
	//			name: 'string - optional',
	//			slug: 'string',
	//			tags: 'array'
	//		}
			
	



	/////////////////////////////////////
	//////////// CTRL METHOD ////////////
	/////////////////////////////////////
	vm.init = function(){
		vm.dropzonevents();
	};

	vm.dropzonevents = function (){
		window.addEventListener('dragenter', function (event) {
			return vm.checkDropzone(event);
		});
		window.addEventListener('dragover', function (event) {
			return vm.checkDropzone(event);
		});
		window.addEventListener('dragleave', function (event) {
			return vm.checkDropzone(event);
		});
		window.addEventListener('drop', function (event) {
			return vm.checkDropzone(event);
		});		
	};

	vm.checkDropzone = function(e){
		if(DEBUG){console.log(e.dataTransfer.files)};
		var ext = '-';
		if(e.dataTransfer.files && e.dataTransfer.files.length && e.dataTransfer.files[0].name && e.dataTransfer.files[0].name.indexOf('.') != -1){
			ext = e.dataTransfer.files[0].name.split('.').pop();
		}

		if (e.target.className.indexOf(dropzoneclass) === -1 || e.dataTransfer.files.length > 1 || ext != filext) {
		//if (e.target.className.indexOf(dropzoneclass) === -1) {
			e.preventDefault();
			e.dataTransfer.effectAllowed = "none";
			e.dataTransfer.dropEffect = "none";
			return false;
		}else{
			return true;
		}
	};

	vm.switchPage = function(page, sub){
		var type = 'page';
		if(sub && sub === 1){
			type = 'subpage';
		}

		if(!vm[type][page]){
			for(var key in vm[type]){
				vm[type][key] = 0;
			}

			if(page === 'editapi' && type === 'page'){
				vm.resetEditPage();
			}

			vm[type][page] = 1;
		}
	};

	vm.resetEditPage = function(){
		vm.navbarClass = 2;
		vm.subpage.editpro = 0;
		vm.subpage.editsrv = 0;
		vm.subpage.editbp = 0;
	};

	vm.gotoHome = function(){
		vm.formTmp = {};
		vm.filePath = '';
		vm.form = angular.copy(vm.formDefault);
		vm.fileObj = angular.copy(vm.formDefault);
		vm.config.unsaved = false;
       	vm.config.saving = false;
       	vm.timingAutoSave();
		vm.switchPage('initpage');
	}

	vm.uploadADG = function(file) {
		if(DEBUG){console.log(file);}
		if(file) vm.getDataUri(file);
	};

	vm.loadADG = function(data, file) {
		if(DEBUG){console.log(data);}
		var error = 0;

		if(data && data.indexOf('@end@') != -1){
			try {
			    var arr = data.split('@end@');
			    var json = JSON.parse(_.rest(arr).join('@end@'));
			    vm.fileObj = angular.copy(json);
			    vm.form = angular.copy(json);
			    
			    vm.filePath = file.path;
	        	vm.switchPage('editapi');
	        	vm.timingAutoSave();
			}
			catch(err) {
			    if(DEBUG){console.log(err);}
			    error = 1;
			}
		}else{
			error = 1;
		}

		if(error){
			$mdDialog.show(
		      $mdDialog.alert()
		        //.parent(angular.element(document.querySelector('#popupContainer')))
		        .clickOutsideToClose(true)
		        .title('ERROR')
		        .textContent('the file is corrupted')
		        .ariaLabel('file corrupted')
		        .ok('OK')
		        //.targetEvent(ev)
		    );
		}
	};

	vm.getDataUri = function(file) {
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                if(DEBUG){console.log(e, e.target.result);}
                vm.loadADG(e.target.result, theFile);
            };
        })(file);

        // Read in the file as a text.
        reader.readAsText(file);
    };

    vm.saveADG = function() {
    	if(DEBUG){console.log('saving')};

    	vm.config.saving = true;
    	var filename = _.slugify(vm.form.project.name) || 'data';
		var obj = angular.copy(vm.form);
		/*var data = "text/plain;charset=utf-8," + encodeURIComponent("#api-docs-gen@end@"+JSON.stringify(obj));
		var a = document.createElement('a');
		a.download = filename+'.adg';
		a.href = 'data:' + data;
		a.click();*/

		if(vm.filePath){
	        // fileName is a string that contains the path and filename created in the save file dialog.  
	        fs.writeFile(vm.filePath, "#api-docs-gen@end@"+JSON.stringify(obj), function (err) {
	            if(err){
	                alert("An error ocurred creating the file "+ err.message)
	            }else{
		           	vm.fileObj = angular.copy(obj);
		           	vm.config.unsaved = false;
		           	vm.config.saving = false;
		           	if(DEBUG){console.log('saved')};
	            }
	                 
	            //alert("The file has been succesfully saved");
	        });
		}else{
			dialog.showSaveDialog({title:'Save project', defaultPath:filename+'.adg', buttonLabel:'Save'}, function (fileName) {
		        if (fileName === undefined){
		            if(DEBUG){console.log("You didn't save the file");}
		            vm.config.saving = false;
		            return;
		        }
		        // fileName is a string that contains the path and filename created in the save file dialog.  
		        fs.writeFile(fileName, "#api-docs-gen@end@"+JSON.stringify(obj), function (err) {
		            if(err){
		                alert("An error ocurred creating the file "+ err.message)
		            }else{
			           	vm.fileObj = angular.copy(obj);
			           	vm.config.unsaved = false;
			           	vm.config.saving = false;
			            vm.filePath = fileName;
			            alert("The file has been succesfully saved");
		            }
		        });
			}); 			
		}

    };

    vm.export = function() {
    	var filename = _.slugify(vm.form.project.name) || 'data';
		var obj = angular.copy(vm.form);
		//console.log(obj);

		for(var k_base in obj.bases){
			for(var k_path in obj.bases[k_base].paths){
				for(var k_service in obj.bases[k_base].paths[k_path].services){
					obj.bases[k_base].paths[k_path].services[k_service].isOpen = false;
				}
			}
		}

		var html = getHtml(filename, obj, 0);

		/*var data = "text/html;charset=utf-8," + encodeURIComponent(html);
		var a = document.createElement('a');
		a.download = filename+'.html';
		a.href = 'data:' + data;
		a.click();*/

		dialog.showSaveDialog({title:'Export Api Doc', defaultPath:filename+'.html', buttonLabel:'Export'}, function (fileName) {
	       if (fileName === undefined){
	            if(DEBUG){console.log("You didn't save the file");}
	            return;
	       }
	       // fileName is a string that contains the path and filename created in the save file dialog.  
	       fs.writeFile(fileName, html, function (err) {
	           if(err){
	               alert("An error ocurred creating the file "+ err.message)
	           }
	                        
	           alert("The file has been succesfully saved");
	       });
		}); 
    };

    vm.timingAutoSave = function(){
    	if(vm.filePath){
			if(vm.config.autosave){
				timingsave = $interval(vm.saveADG, vm.config.autotime*60*1000);
			}else{
				$interval.cancel(timingsave);	
			}
		}else{
			$interval.cancel(timingsave);	
		}
    }

	/**
	 * Editing base & path
	 * @param {Number} act  (1=new, 2=edit, 3=del) 
	 * @param {Number} type (1=base, 2=path)
	 * @param {Object} obj  (base or path)
	 * @param {Array}  ids  ([id base, id path] or [id base] or [])
	 */
	vm.editBasePath = function(act, type, obj, ids) { 
		if(act === 1){ //new
			if(type === 1){
		    	vm.form.bases.push({name: '', description: '', paths: []});
			}else if(type === 2){
				if(obj){
			    	obj.paths.push({name: '', description: '', services: []});
			    }
			}
		}else if(act === 2){ //edit
			if(obj){
				vm.formIdsTmp = ids;			
				vm.formTmp = obj;
				if(type === 1){
			    	vm.switchPage('editbase', 1);
				}else if(type === 2){
			    	vm.switchPage('editsrv', 1);
				}
			}
		}else if(act === 3){ //del
			if(vm.formIdsTmp.length === 1){	//base
				vm.form.bases.splice(vm.formIdsTmp[0], 1);     
				vm.subpage.editbase = 0;
				//delete vm.form.bases[vm.formIdsTmp[0]];
				//_.compact(vm.form.bases);
			}else if(vm.formIdsTmp.length === 2){ //path
				vm.form.bases[vm.formIdsTmp[0]].paths.splice(vm.formIdsTmp[1], 1);     
				vm.subpage.editsrv = 0;
				//delete vm.form.bases[vm.formIdsTmp[0]].paths[vm.formIdsTmp[1]];
				//_.compact(vm.form.bases[vm.formIdsTmp[0]].paths);
			}		
		}
	};


	/**
	 * Editing service
	 * @param {Number} act  (1=new, 2=del) 
	 * @param {Object} obj  (path)
	 * @param {Number}  id  (id service)
	 */
	vm.editService = function(act, obj, id){
		if(act === 1){ //new
			var type = angular.copy(vm.form.project.mime_request);
			var name = angular.copy(obj.name);
			obj.services.push({
				path:name,
				name:'',
				description: '',
				method: '',
				headers: [],
				query: [],
				form: [],
				body: '',
				type: type,
				responses: []
			});
		}else if(act === 2){ //del
			obj.services.splice(id, 1);     
		}
	};


	/**
	 * Editing query string & headers
	 * @param {Number} act  (1=new, 2=del) 
	 * @param {Number} type (1=query, 2=header, 3=form, 4=response)
	 * @param {Object} obj  (service)
	 * @param {Number} id   (id query or id header)
	 */
	vm.editQueryHeaderForm = function(act, type, obj, id){
		var key = '';

		switch(type){
			case 1:
				key = 'query';
				break;			
			case 2:
				key = 'headers';
				break;
			case 3:
				key = 'form';
				break;
			case 4:
				key = 'responses';
				break;
		}

		if(act === 1 && key){ //new
			if(type === 4){
				var type = angular.copy(vm.form.project.mime_response);
				obj[key].push({code:'', body:'', type:type, desc:''});
			}else{
				obj[key].push({name: '', desc: ''});
			}
		}else if(act === 2 && key){ //del
			obj[key].splice(id, 1);     
		}
	};


	/////////////////////////////////////
	//////////// INIT METHOD ////////////
	/////////////////////////////////////
	vm.init();
	vm.timingAutoSave();






	/////////////////////////////////////
	///////////// LISTENERS /////////////
	/////////////////////////////////////
	/*$scope.$on("angular-resizable.resizeEnd", function (event, args) {
		console.log('angular-resizable.resizeEnd', args);
    });
	$scope.$on("angular-resizable.resizeStart", function (event, args) {
		console.log('angular-resizable.resizeStart', args);
    });*/
	$scope.$on("angular-resizable.resizing", function (event, args) {
		if(DEBUG){console.log('angular-resizable.resizing', args);}

		if(args.id === 'navbar'){
			if(args.width >= 300){
				vm.navbarClass = 3;
			}else if(args.width < 300 && args.width >= 210){
				vm.navbarClass = 2;
			}else{
				vm.navbarClass = 1;
			}
		}
    });


	$scope.$watch("vm.form", function (newValue, oldValue) {
		//if (newValue != oldValue)
	        vm.config.unsaved = !angular.equals(newValue, vm.fileObj);
    }, true);

	$scope.$watch("vm.config.autosave", function (newValue, oldValue) {
		if (newValue != oldValue){
	        config.set('autosave', newValue);

        	vm.timingAutoSave();
		}
    });

	$scope.$watch("vm.config.autotime", function (newValue, oldValue) {
		if (newValue != oldValue){
	        config.set('autotime', newValue);

	        vm.timingAutoSave();
		}
    });





}); //end appCtrl

app.directive('stickyContained', ['$window', function($window) {
	var stickies = [];

	var scroll = function scroll() {
		//console.log(arguments);

		for(var i=0; i<stickies.length; i++){

			var containerOffset = stickies[i].container.offset();
			var offsetTop = containerOffset.top;
			var elHeight = stickies[i].el.outerHeight();
			var elOffset = stickies[i].el.offset();
			var elPos = stickies[i].el.position();
			var containerHeight = stickies[i].container.outerHeight();
			var containerVis = containerHeight-Math.abs(offsetTop);

			if(offsetTop < -stickies[i].position.top){
				
				stickies[i].el.addClass('isSticky');
			
				//console.log(containerVis, elHeight, containerHeight, offsetTop);
				if(containerVis<=elHeight){
					stickies[i].el.css('top', Math.abs(containerHeight-elHeight));
				}else{
					stickies[i].el.css('top', Math.abs(offsetTop));
				}						

			}else{
				stickies[i].el.css('top', stickies[i].position.top).removeClass('isSticky');
			}
			
			//console.log('scroll', stickies[i].el.text(), containerHeight-Math.abs(offsetTop), stickies[i].container, stickies);
		}
	};
	var link = function($scope, element, attrs) {
		//console.log(arguments);

		var scroller = angular.element($window);
		var container = angular.element($window);
		var el = element;

		if(attrs.scrollContainer)
			container = scroller = element.closest(attrs.scrollContainer);

		if(attrs.stickyContainer)
			container = element.closest(attrs.stickyContainer);

		if(DEBUG){console.log(el.position())};

	    angular.element(scroller).on('scroll', scroll);

		stickies.push({scroller:scroller, container:container, el:el, position:el.position()});

		$scope.$on('$destroy', function() {
	        //console.log("destroy", _.findIndex(stickies, {el: element}));

	        var i = _.findIndex(stickies, {el: element});
	        angular.element(stickies[i].scroller).off('scroll', scroll).on('scroll', scroll);
	        stickies.splice(i, 1);
	    });

	};
    
    return {
		restrict: 'A',
		link: link
    };
}]); //end directive


})(); //end closure

