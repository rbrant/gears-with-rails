// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults
LOGGING = true;

$.ajaxSetup({
	beforeSend: function(xhr) {
		xhr.setRequestHeader("Accept", "text/javascript");
	}
})


$(document).ready(function() {
	
	console.log('doc ready...')
	Offline.getOfflineStatus();

	if(Offline.isOffline()){
			
		$('form#new_person').bind('submit', function(){
		
				// presence of rowid field indicates editing
				if($('#rowid').val() == ''){
					console.log('creating offline person');
					MyGearsApp.createPerson( $('#person_first_name').val(), $('#person_last_name').val() );
				}else{
					console.log('editing offline person');
					MyGearsApp.updatePerson( $('#rowid').val(), $('#person_first_name').val(), $('#person_last_name').val() );
				}
				// redirect to listing
				window.location = '/people'
				return false;
			
		});
	
		// on edit form load we populate the rowid field with the url param	
		if($.url.param("rowid")){
			var rowid = $.url.param("rowid");
			var person = new Person(parseInt(rowid));
		
			$('#rowid').val(rowid);
			$('#person_first_name').val(person.firstName)
			$('#person_last_name').val(person.lastName)		
			
			$('form#new_person .submit').val('Update');
		}

		if($('#table_people')){
	    MyGearsApp.getPeopleRows();
	  }
		
	}

});
	

var MyGearsApp =
{
	init:function()
	{
		JStORM.connections = 
		{
			"default":
			{
				PROVIDER:"Gears",
				DIALECT:"SQLite",
				PATH:"test_simple"
			}
		};

		Person = new JStORM.Model({
		  name:"Person",
		  fields:
		  {
				remoteId:new JStORM.Field({type:"Integer"}),
				firstName:new JStORM.Field({type:"String",maxLength:25}),
				lastName:new JStORM.Field({type:"String",maxLength:25})
		  },
		  connection:"default"
		});

		// create the Person table if it doesn't exist
		if(!Person.doesTableExist()){
			Person.createTable();			
		}
		
	},
	
	goOffline:function()
	{
		// suck down all the data from the server
		if(Person.doesTableExist()){Person.dropTable();}
		if(!Person.doesTableExist()){Person.createTable();}

		MyGearsApp.syncDataDown();

		// create the gears resource store
		Store.createStore();

		// set the cookie flag as offline
		Offline.goOffline();
		
		// sets the display indicating mode
		Offline.getOfflineStatus();
	},
	
	goOnline:function()
	{
		// sycn gears data with remote
		MyGearsApp.syncDataUp();
		
		// drop the local table; we are done wth it.
		if(Person.doesTableExist()){Person.dropTable();}
		
		// removes the resource store
		Store.removeStore();

		// detroys the cookie flag
		Offline.goOnline();

		// changes the display
		Offline.getOfflineStatus();
		
		window.location = '/';
	},
	
	getPeopleRows:function()
	{
		var data = '';
		var header = '<tr><th>First name</th><th>Last name</th></tr>';
		var rows = '';
		Person.all().each(function(person)
		{
			rows += '<tr id="personRow' + person.rowid + '"><td>' + person.firstName + '</td><td>' + person.lastName + '</td><td><a href="/people/new?rowid='+ person.rowid + '">Edit</a></td><td><a href="#" onclick="MyGearsApp.destroyPerson(' + person.rowid + ');">Destroy</a></td></tr>' 
		});
		data = header + rows;
		$('#table_people').html(data);
	},
	
	// syncs only Person data for now..
	syncDataDown:function()
	{
		// step 1: sycn data down
		$.getJSON("/people", function(data){
			$.each(data, function(i,item){
				console.log('creating person in local db')
				MyGearsApp.createPerson(item.person.first_name, item.person.last_name,item.person.id);
			});
		});
	},
	
	syncDataUp:function()
	{
		var people = Person.all().toArray();
		var data = new Array();

		// create the json for rails to parse
		$.each(people, function(i,item){
			data.push( {first_name:item.firstName, last_name:item.lastName, remoteid: item.remoteId} )
		});

		$.ajax({
			type: "POST",
			url: '/people/sync_up_from_gears',
			data: {people: $.toJSON(data) },
			dataType: 'json'
		});
	},
	
	createPerson:function(firstName,lastName,remoteId)
	{
		if(!remoteId){remoteId = null}
		var person = new Person();
		person.remoteId = remoteId;
		person.firstName = firstName;
		person.lastName = lastName;
		person.save();
	},
	
	editPerson:function(id)
	{
		var person = new Person(id);
	},
	
	updatePerson:function(id,firstName,lastName)
	{
		console.log('updating person..')
		var person = new Person(parseInt(id)); 
		person.firstName = firstName;
		person.lastName = lastName;
		person.save();
	},
	
	destroyPerson:function(id)
	{
		var person = new Person(id);
		person.remove();
		$('#personRow' + id).hide();
	}	
};


// Gears resource store
var Store = 
{
  storeName : 'my_gears',
	localServer : '',
	filesToCapture : [
	  location.pathname,
	  '/javascripts/application.js',
	  '/javascripts/jquery-1.3.2.min.js',
	  '/javascripts/cookie.js',
		'/javascripts/url.js',
	  '/javascripts/gears_init.js',
	  '/javascripts/google_helpers.js',
	  '/javascripts/jstorm/src/JStORM.js',
		'/javascripts/jstorm/src/JStORM.Query.js',
		'/javascripts/jstorm/src/JStORM.Sql.js',
		'/javascripts/jstorm/src/JStORM.Field.js',
		'/javascripts/jstorm/src/JStORM.ModelMetaData.js',
		'/javascripts/jstorm/src/JStORM.Model.js',
		'/javascripts/jstorm/src/JStORM.Events.js',
		'/javascripts/jstorm/src/providers/JStORM.Gears.js',
		'/javascripts/jstorm/src/dialects/JStORM.SQLite.js',
		'/people/new',
	  '/people'
	],
	
	init:function()
	{

	  if (!window.google || !google.gears) {
	    if (confirm("This demo requires Gears to be installed. Install now?")) {
	      // Use an absolute URL to allow this to work when run from a local file.
	      location.href = "http://code.google.com/apis/gears/install.html";
	      return;
	    }else{
				addStatus('Gears is not installed', 'error');
		    return;
			}
	  }

	  try {
	    localServer = google.gears.factory.create('beta.localserver');
	  } catch (ex) {
	    var buttons = document.forms[0].elements;
	    for (var i = 0, el; el = buttons[i]; i++) {
	      el.disabled = true;
	    }

	    setError('Could not create local server: ' + ex.message);

	    return;
	  }

	},

	createStore:function()
	{
	  if (!checkProtocol()) return;

	  // If the store already exists, it will be opened
	  try {
	    localServer.createStore(Store.storeName);
	    clearStatus();
	    addStatus('Created the store');
			Store.capture();
	  } catch (ex) {
	    setError('Could not create store: ' + ex.message);
	  }
	},

	capture:function()
	{
	  var store = localServer.openStore(Store.storeName);
	  if (!store) {
	    setError('Please create a store for the captured resources');
	    return;
	  }

	  clearStatus();
	  addStatus('Capturing...');

	  // Capture this page and the js library we need to run offline.
	  store.capture(Store.filesToCapture, Store.captureCallback);

		addStatus('Finished capturing');

	},

	captureCallback:function(url, success, captureId) 
	{
	  addStatus(url + ' captured ' + (success ? 'succeeded' : 'failed'));
	},

	uncapture:function()
	{
	  var store = localServer.openStore(Store.storeName);
	  if (!store) {
	    setError('Please create a store for the captured resources');
	    return;
	  }

	  for (var i = 0; i < Store.filesToCapture.length; i++) {
	    store.remove(Store.filesToCapture[i]);
	  }

	  clearStatus();
	  addStatus('Removed files from the store');
	},

	removeStore:function() 
	{

		Store.uncapture();

	  // We call openStore() to test for it's existence prior to removing it
	  if (localServer.openStore(Store.storeName)) {
	    localServer.removeStore(Store.storeName);
	    clearStatus();
	    addStatus('Removed the store');
	  } else {
	    clearStatus();
	    addStatus('The store does not exist', 'error');
	  }
	}
}

var Offline =
{
	goOffline:function()
	{
		// set offline cookie
		$.cookie('offline', 'true');
	},

	goOnline:function()
	{
		// destroy online cookie
		$.cookie('offline', null);
	},

	isOffline:function()
	{
		return $.cookie('offline') == 'true' ? true : false
	},

	getOfflineStatus:function()
	{
		if(Offline.isOffline()){
			$('#offline_status').html("Status: OFFLINE");
			$('#go_online').show();
			$('#go_offline').hide();
		}else{
			$('#offline_status').html("Status: ONLINE");
			$('#go_online').hide();
			$('#go_offline').show();	
		} 
	},

	alertOfflineStatus:function()
	{
		if( $.cookie('offline') == null){
	    alert('online');
	  }else{
	    alert('offline')
	  }

	}
};


Store.init();
MyGearsApp.init();
