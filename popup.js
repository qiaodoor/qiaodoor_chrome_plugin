/**
 * The popup script would be executed when user clicked the chrome plugin's icon
 * 
 */
(function(){ 
	
	// STEP 1: invoked when plugin popup page show up
	document.addEventListener('DOMContentLoaded', function () {
		jQuery('#uploadHref').click(function(){
			chrome.tabs.query({active:true,currentWindow:true},function( tabsFound ){
				var token = jQuery('#token').val();
				if (!token) {
				    jQuery('#errMsg').innerHTML = 'Token Is Empty' ;
			    } else {
				    jQuery('#errMsg').innerHTML = '' ;
					// STEP 2: ask background process inject code into current tab
					var port = chrome.extension.connect({name: "popup->background"});
	                port.postMessage({ tab : tabsFound[0] , message : 'injectPageVisitor' , token : token });
			    }
			});
		});
	});
})();
