// An example Parse.js Backbone application based on the todo app by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses Parse to persist
// the todo items and provide user authentication and sessions.

$(function() {

	Parse.$ = jQuery;

	// Initialize Parse with your Parse application javascript keys
	Parse.initialize("LfGQxgnaUQk6JC0s6uacLC1WzMxqx6T6jSa0SWK1", "dVFKqVcfVxOmsUrhH21DJ3aifO27m0aWgG0xs0uU");
		
	// Meeting Model
	// ----------
	var Meeting = Parse.Object.extend("Meeting", {
		// Default attributes for the todo.
		defaults: {
			name: "New Meeting"
		},

		// Ensure that each todo created has `content`.
		initialize: function() {
			if (!this.get("name")) {
				this.set({"name": this.defaults.name});
			}
		},

		// Toggle the `done` state of this todo item.
		toggle: function() {
			this.save({done: !this.get("done")});
		}
	});
	
	
	// Meeting Collection
	// ---------------
	var MeetingList = Parse.Collection.extend({
		// Reference to this collection's model.
		model: Meeting,

		// What should we sort by?
		// comparator: function(todo) {
		// 	return todo.get('order');
		// }
	});
	
	// Meeting View
	// --------------
	// The DOM element for a todo item...
	var MeetingView = Parse.View.extend( {

		//... is a list tag.
		tagName: "li",

		// Cache the template function for a single item.
		template: _.template($('#meeting-template').html()),

		// The DOM events specific to an item.
		events: {
			"click .meeting.destroy" : "clear",
			"keypress .edit" : "updateOnEnter",
			// "blur .edit" : "close"
		},

		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a Todo and a TodoView in this
		// app, we set a direct reference on the model for convenience.
		initialize: function() {
			_.bindAll(this, 'render', 'remove');
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},

		// Re-render the contents of the todo item.
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			
			// console.log( this.model.toJSON() );
			this.input = this.$('.edit');
			return this;
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function(e) {
			if (e.keyCode == 13)
			{
				this.model.save({name: this.input.val()});
			}
		},

		// Remove the item, destroy the model.
		clear: function() {
			this.model.destroy();
		}

	});
	
	// Item Model
	// ----------
	var Item = Parse.Object.extend("Item", {
	});
	
	// Item View
	// --------------
	var ItemView = Parse.View.extend( {

		//... is a list tag.
		tagName: "li",

		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// The DOM events specific to an item.
		events: {
			"click .activate": "activate"
			// "click .meeting.destroy" : "clear",
			// "keypress .edit" : "updateOnEnter",
			// "blur .edit" : "close"
		},

		initialize: function() {
			_.bindAll(this, 'render', "activate");
			this.model.bind('change', this.render);
			this.model.bind('destroy', this.remove);
		},
		
		// Enter into editing mode for the item
		activate: function() {
			new EditView({model: this.model});
		},
		
		// Re-render the contents of the todo item.
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		}

	});
	
	// This is the transient application state, not persisted on Parse
	var AppState = Parse.Object.extend("AppState", {
		defaults: {
			filter: "all"
		}
	});
	
	// We use this to make Google calls
	var gToken = false;

	// The Application
	// ---------------
	
	// The view which lets users take attendance & edit events
	var EditView = Parse.View.extend({
		
		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"click .changeView.manage": "backList",
			"click .boop": "boop"
			// "click .log-out": "logOut"
		},

		el: ".content",
		
		template: _.template($('#edit-template').html()),

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved to Parse.
		initialize: function() {
			var self = this;

			_.bindAll(this, 'render' );

			// persist the event into the database + make sure we're using the right one
			this.model.save({}).then(function( meeting ) {
		    // The meeting was successfully persisted
				console.log( meeting );
		  }, function(error) {
		    // The save failed. Most likely due to a UUID issue, so fetch a whole new one
				query = new Parse.Query(Meeting);
				query.equalTo("uuid", self.model.get("uuid"));
				query.first({
					success: function( meeting ) {
						// fill in any local properties we want to save
						_.each( ['name', 'raw_description', 'raw_attendees', 'start', 'end'], function( prop ) {
							meeting.set( prop, self.model.get( prop ) );
						});
						
						// save them (assume Backbone is smart)
						meeting.save();
						
						// override the local one with the server copy
						self.model = meeting;
						
						// re-render
						self.render();
						
					}
				})
		  });

			// render the management template
			self.render();

			// state.on("change", this.filter, this);
		},

		// we should do some rendering in here
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			
			return true;
		},
		
		// go back to the main list
		backList: function() {
			new ManageView();
		},
		
		boop: function() {
			alert( this.model.get( "raw_description" ) );
		}
		
	});

	// The main view that lets a user manage the list
	var ManageView = Parse.View.extend({
		
		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"keypress #new-meeting": "createOnEnter",
			"click .log-out": "logOut"
		},

		el: ".content",
		
		// Cache the template function for a single item.
		template: _.template($('#item-template').html()),

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved to Parse.
		initialize: function() {
			var self = this;

			_.bindAll(this, 'addOne', 'addAll', 'render', 'logOut', 'createOnEnter');

			// Main management template
			this.$el.html(_.template($("#manage-template").html()));

			this.input = this.$("#new-meeting");
			
			// Create our collection of Meetings
			this.meetings = new MeetingList;
			
			// Setup the query for the collection to look for todos from the current user
			this.meetings.query = new Parse.Query(Meeting);
			this.meetings.query.equalTo("user", Parse.User.current());

			this.meetings.bind('add', this.addOne);
			this.meetings.bind('reset', this.addAll);
			this.meetings.bind('all', this.render);

			// Fetch all the todo items for this user
			this.meetings.fetch();
			
			// fill in our Google Token
			$.oajax({
				url: "http://passport.sg.nyuad.org/visa/google/token",
				jso_provider: "passport",
				jso_scopes: ["user.me.netID", "google:https://www.googleapis.com/auth/calendar"],
				jso_allowia: true,
				dataType: 'json',
				success: function(data) {					
					gToken = data.access_token;
					
					var d = new Date(); // today!
					d.setDate(d.getDate() - 2); // go back 2 days
										
					// now that we have a token, fetch a list of calendars
					$.getJSON( "https://www.googleapis.com/calendar/v3/calendars/" + Parse.User.current().getEmail() + "/events?timeMin=" + d.toISOString() + "&access_token=" + gToken, function( data ) {
						_.each( data.items, function( GEV ) {
							console.log( GEV );
												
							self.meetings.add({
								uuid: GEV.iCalUID,
								name: GEV.summary,
								raw_description: GEV.description,
								raw_attendees: GEV.attendees,
								start: new Date( GEV.start.dateTime ),
								end: new Date( GEV.end.dateTime )
							});
						});
						
						// Parse.Cloud.run('hello', {}, {
						// 	success: function(result) {
						// 		console.log( result );
						// 	},
						// 	error: function(error) {
						// 	}
						// });
						
						// ManageView.meetings.create({
						// 							name: this.input.val(),
						// 							// order:   this.todos.nextOrder(),
						// 							// done:    false,
						// 							user:    Parse.User.current(),
						// 							ACL:     new Parse.ACL(Parse.User.current())
						// 						});
					});
				}
			});

			// state.on("change", this.filter, this);
		},

		// Logs out the user and shows the login view
		logOut: function(e) {
			Parse.User.logOut();
			new LogInView();
			this.undelegateEvents();
			delete this;
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
		},
		
		// Add a single event item to the list by creating a view for it
		addOne: function( meeting ) {
			var view = new ItemView({model: meeting});
			this.$("#item-list").append(view.render().el);
		},

		// Add all items in the Todos collection at once.
		addAll: function(collection, filter) {
			this.$("#item-list").html("");
			this.meetings.each(this.addOne);			
		},

		// Only adds some todos, based on a filtering function that is passed in
		// addSome: function(filter) {
		// 	var self = this;
		// 	this.$("#event-list").html("");
		// 	this.todos.chain().filter(filter).each(function(item) { self.addOne(item) });
		// },

		// If you hit return in the main input field, create new Todo model
		createOnEnter: function(e) {
			var self = this;
			if (e.keyCode != 13) return;
						
			this.meetings.create({
				name: this.input.val(),
				// order:   this.todos.nextOrder(),
				// done:    false,
				user:    Parse.User.current(),
				ACL:     new Parse.ACL(Parse.User.current())
			});

			this.input.val('');
			// this.resetFilters();
		},

		// Clear all done todo items, destroying their models.
		// clearCompleted: function() {
		// 	_.each(this.todos.done(), function(todo){ todo.destroy(); });
		// 	return false;
		// },
		// 
		// toggleAllComplete: function () {
		// 	var done = this.allCheckbox.checked;
		// 	this.todos.each(function (todo) { todo.save({'done': done}); });
		// }
	});

	var LogInView = Parse.View.extend({
		events: {
			"click .action.login": "logIn"
		},

		el: ".content",

		initialize: function() {
			_.bindAll(this, "logIn");
			this.render();
		},
		
		logIn: function(e) {
			this.$(".action.login").attr("disabled", "disabled");
			
			jso_ensureTokens({
				"passport": ["user.me.netID", "google:https://www.googleapis.com/auth/calendar"]
			});

			$.oajax({
				url: "http://passport.sg.nyuad.org/visa/use/info/me",
				jso_provider: "passport",
				jso_scopes: ["user.me.netID", "google:https://www.googleapis.com/auth/calendar"],
				jso_allowia: true,
				dataType: 'json',
				success: function(data) {					
					Parse.User.logIn( data.netID, jso_getToken("passport"), {
					  success: function(user) {
					    new ManageView();
					    self.undelegateEvents();
					    delete self;
					  },
					  error: function(user, error) {
							// no account, so create it
							Parse.User.signUp(data.netID, jso_getToken("passport"), {
								ACL: new Parse.ACL(),
								email: data.netID + '@nyu.edu'
							}, {
								success: function(user) {
									new ManageView();
									self.undelegateEvents();
									delete self;
								},
								error: function(user, error) {
									self.$(".login .error").html(error.message).show();
									this.$(".action.login").removeAttr("disabled");
								}
							});
					  }
					});
					
				}
		  });
		},

		render: function() {
			this.$el.html(_.template($("#login-template").html()));
			this.delegateEvents();
		}
	});

	// The main view for the app
	var AppView = Parse.View.extend({
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: $("#todoapp"),

		initialize: function() {
			this.render();
		},

		render: function() {
			if (Parse.User.current()) {
				new ManageView();
			} else {
				new LogInView();
			}
			}
		});

	var AppRouter = Parse.Router.extend({
		routes: {
			"all": "all",
			"active": "active",
			"completed": "completed"
		},

		initialize: function(options) {
		},

		all: function() {
			state.set({ filter: "all" });
		},

		active: function() {
			state.set({ filter: "active" });
		},

		completed: function() {
			state.set({ filter: "completed" });
		}
	});

	var state = new AppState;

	new AppRouter;
	new AppView;
	Parse.history.start();
});