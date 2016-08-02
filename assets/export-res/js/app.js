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

var app = angular.module('app', ['ngMaterial', 'ngAnimate', 'ngAria', 'ngMessages', 'angularResizable', 'ng.deviceDetector', 'hljs']);

app.constant('DEBUG', DEBUG);

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

app.controller('appCtrl', function($scope, $mdDialog, $sce, $mdToast, $interval, DEBUG, $timeout, $mdSidenav, $log, $mdMedia, deviceDetector){
	var vm = this;
	/////////////////////////////////////
	////////////// CTRL VARS ////////////
	/////////////////////////////////////
	vm.deviceDetector = deviceDetector;
	vm.form = angular.copy(__OBJ);

	vm.page = {
		initpage : 0,
		newapi   : 0,
		editapi  : 1
	};

	vm.subpage = {
		editpro  : 0,
		editsrv  : 0,
		editbase : 0
	};

	vm.navbarClass = 2;// 3=ico+text   2=text   1=ico

	vm.content_type_req = ['text', 'xml', 'json', 'form'];
	vm.content_type_res = ['text', 'xml', 'json'];
	vm.method_list = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'TRACE', 'HEAD'];





	/////////////////////////////////////
	//////////// CTRL METHOD ////////////
	/////////////////////////////////////



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



	/////////////////////////////////////
	//////////// INIT METHOD ////////////
	/////////////////////////////////////
	//vm.switchPage('editapi');




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


	/*$scope.$watch("vm.formBase.name", function (newValue, oldValue) {
		if (newValue != oldValue && !newValue)
	        vm.formBase.name = '-';	
    });*/


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

		console.log(el.position());

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

