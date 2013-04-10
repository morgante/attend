Parse.initialize("LfGQxgnaUQk6JC0s6uacLC1WzMxqx6T6jSa0SWK1", "dVFKqVcfVxOmsUrhH21DJ3aifO27m0aWgG0xs0uU");

var Event = Parse.Object.extend("Event");

var logician = {
	
	make_event: function( event, cb ) {
		var event = new Event();
		event.save( event, {
			success: function( object ) {
				if( cb )
				{
					cb( null, object );
				}
			},
			error: function( model, error ) {
				if( cb )
				{
					cb( error, model );
				}
			}
		} );
	}
	
};