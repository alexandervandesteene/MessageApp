/* lijst van taken */
var gTodos;

/* lijst van users */
var gUsers;

/* huidige gebruiker */
var gCurrentUser;

function createTodo(userId, text,number) {
	return {
		text : text,
		status : "todo",
		userId : userId,
		number : number,
		id : -1
	};
}

function createUser(userId, name,number) {
	return {
		id : userId,
		name : name,
		phoneNumber:number
	};
}

function addTodo(event) {

	var userId=gCurrentUser.id;
	var text=$("#message").val();
	var number = gCurrentUser.phoneNumber;

	sendSms(number,text);

	navigator.notification.alert(
            'Message verzonden naar \n'+gCurrentUser.name +"\nmet nummer: \n"+gCurrentUser.phoneNumber,  // message
            alertDismissed,         // callback
            'Verzonden',            // title
            'Done'                  // buttonName
        );
	
	var todo = createTodo(userId, text,number);
	
	gTodos.push(todo);
	
	// zorg ervoor dat de lijst weer uptodate is als we terugkeren
	refreshList();
	$("#message").val("");

}

function alertDismissed()
{
	// hier gebeurd niets
}

function doNew(event) {
	var anchor = $(this);
	
	// beslis welke gebruiker we best selecteren, op basis van op welke link er geklikt werd (via id)
	var isPersoonlijk = (anchor.attr("id") == "newP");
	var userIdToSelect = (isPersoonlijk ? gCurrentUser.id : gUsers[0].id);
	
	// zorg ervoor dat de new page 'geladen' is. Zie uitleg in doEdit() method
	$.mobile.loadPage("#new");

	// vul de user lijst en selecteer de huidige gebruiker
	fillUsersAndSelect("#userN", userIdToSelect);

	// maak tekst veld leeg
	$("#textN").val("");
}

function refreshList() {
	// verwijder alle li's uit de lijst met id="todos", behalve onze dividers
	// .. dit doet hetzelfde als $("#todos li[data-role!=list-divider]");
	// maar dat is 'chance' hebben want later zal men dit attribuut in
	// de gerenderde versie misschien wel ooit verwijderen/vervangen door een class...
	var nonDividerListItems=$('#todos li:jqmData(role!="list-divider")');
	nonDividerListItems.remove();

	for ( var i = gTodos.length-1; i >= 0; i--) {
		var todo = gTodos[i];
		var divider = null;
		if (todo.status == "todo") {
			if (todo.userId == gCurrentUser.id) {
				divider = $('#persoonlijk');
			} 
		}
		// voeg todo toe als list item na divider
		$('<li><a class="todo" todoIndex="' + i + '" href="#edit">' + todo.text + '</a></li>').insertAfter(divider);
	}

	// refresh de lijst (zodat jquery mobile de kans krijgt om z'n magie te doen)
	$("#todos").listview('refresh');
	
	localStorage.gTodos = JSON.stringify(gTodos);
}

function refreshUsersTab()
{
	$("#users li").remove();
	
	for(var userIdx in gUsers)
	{
		if(userIdx == gCurrentUser.id)
			$("#users").append("<li data-role='list-divider'>" + gUsers[userIdx].name + "</li>");
		else
			$("#users").append("<li><a href='#todo' data-id='" + gUsers[userIdx].id + "'>" + gUsers[userIdx].name + "</a></li>");
	}

	$("#username").val("");
	
	$("#users").listview('refresh');
}

function refreshGreeting()
{
	var todoHeader=$(":jqmData(role='page') > :jqmData(role='header') > h1:first-child");
	todoHeader.html("Bericht naar " + gCurrentUser.name);
}

function doLogin(userId)
{
	localStorage.gCurrentUserId = userId;
	gCurrentUser = gUsers[userId];
	//alert(gCurrentUser.id);
	refreshGreeting();
	refreshList();			// nodig want 'wat aan mij toegewezen is' verandert als user verandert
}

function renameMyself()
{
	gCurrentUser.name = $("#username").val();
	localStorage.gUsers = JSON.stringify(gUsers);
	refreshGreeting();
}

 function sendSms(number,message) {
 		//alert("klik");
        var number = number;
        var message = message;
    
        var msg = {
			phoneNumber:number,
			textMessage:message
		};
		sms.sendMessage(msg,message);
}

function addcontacts()
{
	var options = new ContactFindOptions();
    options.filter="";          // empty search string returns all contacts
    options.multiple=true;      // return multiple results
    filter = ["displayName","phoneNumbers"];   // return contact.displayName field

    navigator.contacts.find(filter, onSuccess, onError, options); 
}

function onSuccess(contacts) {
	var aantalcontacten = 0;
    for (var i=0; i<contacts.length; i++) {
    	if(null != contacts[i].displayName)
    	{	
	        if(null != contacts[i].phoneNumbers)
	            {
	                for (var j=0; j<contacts[i].phoneNumbers.length; j++) {
	                	if(contacts[i].phoneNumbers[j].type == "mobile")
	                	{
	           				var newId = gUsers.length;
							gUsers.push(createUser(newId, contacts[i].displayName,contacts[i].phoneNumbers[j].value));
							localStorage.gUsers = JSON.stringify(gUsers);
							//alert("toegevoegd " + contacts[i].displayName +"\n nummer: "+contacts[i].phoneNumbers[j].value);
							refreshUsersTab();
							aantalcontacten++;
     					}
					}
	           }
 		}   
    }
    navigator.notification.alert(
            aantalcontacten+" contacten zijn toegevoed",  // message
            alertDismissed,         // callback
            'Toegevoed',            // title
            'ok'                  // buttonName
        );
}
 // onError: Failed to get the contacts
function onError(contactError) {
     alert('onError!');
}

function removeTodo(event) {
	var hiddenField=$("#saveForm input[name='todoIndex']");
	var todoIndex=parseInt( hiddenField.val() );
	
	// verwijder de todo uit de lijst
	gTodos.splice(todoIndex, 1);

	// zorg ervoor dat de lijst weer uptodate is als we terugkeren
	refreshList();
}


$(document).ready(function() {
	gTodos = JSON.parse(localStorage.gTodos || "[]");
	var usersJson = localStorage.gUsers;
	if(typeof usersJson == "undefined")
		gUsers = [ createUser(0, 'Ik','0496881386') ];
	else
		gUsers = JSON.parse(usersJson);
	var currentUserId = localStorage.gCurrentUserId;
	if(typeof currentUserId == "undefined")
		currentUserId = 0;
	else
	{
		currentUserId = parseInt(currentUserId);
		if(isNaN(currentUserId))
			currentUserId = 0;
	}
	
	console.log('current user');
	console.log(currentUserId);
	gCurrentUser = gUsers[currentUserId];
	
	$.mobile.loadPage("#users");

	refreshGreeting();
	
	// voor de "new" form
	$("#create").click(addTodo);

	// om de "new" form de juiste inhoud te geven
	$("#newP, #newA").click(doNew);

	// om steeds de recentste gebruikerslijst te tonen in tab gebruikers
	$("a[href='#gebruikers']").click(refreshUsersTab);
	
	// en de login-functionaliteit steeds te laten werken met de links in die tab
	$(document).on("click", "#users li a", function() { doLogin($(this).data("id")); });

	
	// zorg ervoor dat we zeker op de todo page zitten, voor
	// het geval de gebruiker .../index.html#edit gebookmarkt heeft
	$.mobile.changePage("#todo");
	
	// refresh de lijst een eerste keer
	refreshList();

	//remove message
	$("#delete").click(removeTodo);

	//contacts
	$("#importcontact").click(addcontacts);
});
