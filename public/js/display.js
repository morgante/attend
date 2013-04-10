if (Parse.User.current()) {
	new ManageTodosView();
} else {
	new LogInView();
}