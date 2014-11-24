/**
 * The background script would be executed when the chrome browser been started
 * 
 */
(function(){   
	var theURL             = 'http://www.qiaodoor.com/plugin/' ;
	var devMode            = !!(theURL.match(/http[s]?[:][/][/]localhost[:]?.*/)) ;
	var urlFilters         = {} ;
	var pageVisitorsLoaded = {} ;
	var jqueryCode         = '' ;
	
	// STEP 1: get the urlFilters
	jQuery.ajax({
		type : "GET"
	  , url  : theURL + "filters.json" 
	  , async: false
	  , success : function(str,status){
		  if (status === 'success') {
		      urlFilters = JSON.parse(str) ;
		      for (var idx=0; idx <urlFilters.length; idx ++) {
			      urlFilters[idx]["matchExpr"]   = new RegExp(urlFilters[idx]["matchExpr"]); 
			      urlFilters[idx]["pageVisitor"] = urlFilters[idx]["pageVisitor"] || "" ; 
			  }	  
		  }
	  } 
	}); 
	
	jQuery.ajax({
		type : "GET"
	  , url  : theURL + 'jquery.js'
	  , async: false
	  , success : function(str,status){
	      jqueryCode = str ;
	  } 
	});  
						
	// STEP 2: watch the tab's url, if it matched urlFilters, we would enable the plugin icon
    chrome.tabs.onUpdated.addListener(function( tabId, changeInfo, tab ){
	    if (changeInfo.status === 'complete') { 
		    
		    for (var idx=0; idx <urlFilters.length; idx ++) {
			    if ( urlFilters[idx].matchExpr.test(tab.url) ) {
				    // STEP 3: showup the icon
				    chrome.pageAction.show(tabId); 
				    pageVisitorsLoaded[tabId] = false ; 
				    break ;   
				}
		    }
		}
	});
	
	// STEP 3 : listen message from popup 
	chrome.extension.onConnect.addListener(function(port) { 
        port.onMessage.addListener(function(msg) {
	        msg = msg || {} ;
	        
	        // STEP 3.1: popup notified background inject content code into current page
	        if (msg.message === 'injectPageVisitor' && msg.tab && msg.tab.url && msg.token ) {
		        
			    for (var idx=0; idx <urlFilters.length; idx ++) {
				    if ( urlFilters[idx].matchExpr.test(msg.tab.url) ) {
					    
					    if(!pageVisitorsLoaded[msg.tab.id] || devMode ) {
		                    pageVisitorsLoaded[msg.tab.id] = true ;
		        
						    // STEP 3.2: get the pageVisitor code if not done so
					    	jQuery.ajax({
								type : "GET"
							  , url  : theURL + urlFilters[idx].pageVisitor + '?ver=' + new Date().getTime()
							  , async: false
							  , success : function(str,status){
							      urlFilters[idx].script = ( devMode ? 'debugger\n' : '' ) + 'var token="' + msg.token + '";\n' + str ; 
							  } 
							  , error  : function( xml, status , e ) {
								  urlFilters[idx].script = "console.warn('" + urlFilters[idx].pageVisitor + " failure:" + xml.responseText + "');" ;
							  }
							}); 
					    }
						// STEP 3.3: inject the code into current target web page
						chrome.tabs.executeScript(msg.tab.id, { code : jqueryCode });
			            chrome.tabs.executeScript(msg.tab.id, { code : urlFilters[idx].script });
			            
					    break ;   
					}
			    }		        
		    }
	    });
	});
})();
