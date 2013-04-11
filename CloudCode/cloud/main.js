// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});


// Enforce UUID on Meetings
// ==============
var Meeting = Parse.Object.extend("Meeting");
// Check if uuid is set, and enforce uniqueness based on the uuid column.
Parse.Cloud.beforeSave("Meeting", function(request, response) {
  if ( !request.object.get("uuid") ) {
    response.error('A meeting must have a uuid.');
  } else if( !request.object.existed() ) {
    var query = new Parse.Query(Meeting);
    query.equalTo("uuid", request.object.get("uuid"));
    query.first({
      success: function(object) {
        if (object) {
          response.error("A Meeting with this uuid already exists.");
        } else {
          response.success();
        }
      },
      error: function(error) {
        response.error("Could not validate uniqueness for this Meeting object.");
      }
    });
  }
	else
	{
		response.success();
	}
});