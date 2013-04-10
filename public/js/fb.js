console.log( 'fb' );

window.fbAsyncInit = function() {
	// init the FB JS SDK
	Parse.FacebookUtils.init({
		appId      : '183132245169115',                        // App ID from the app dashboard
    cookie     : true, // enable cookies to allow Parse to access the session
    xfbml      : true  // parse XFBML
	});
};

// Load the SDK asynchronously
(function(d, s, id){
	var js, fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement(s); js.id = id;
	js.src = "//connect.facebook.net/en_US/all.js";
	fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));