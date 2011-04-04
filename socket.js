var http = require('http');  
var io = require('socket.io'); // for npm, otherwise use require('./path/to/socket.io') 


var server = http.createServer(function(req, res){ 

 res.writeHead(200, {'Content-Type': 'text/html'}); 
 
 res.end('hi'); 
});

server.listen(8124);


var spaces={};
var masters=[];

var links=[]; //holds links

var nextID=1;

var pendingLink=false;

// socket.io 
var socket = io.listen(server);
socket.on('connection', function(client){ 
	// new client is here! 
	//console.log('connected!');
	
	//console.log(client);

	client.sendJSON = function(data){
		this.send(JSON.stringify(data));
	}

	client.on('message', function(msg){
		var data=JSON.parse(msg);

		//console.log(data);
		
		if(client.parent){
			client.parent.handleMessage(data);
		}else if(data.declare){
			if(data.declare=='master'){
				new Master(client);
			}else if(data.declare=='space'){
				new Space(client);
			}
		}
	});
	
	client.on('disconnect', function(){
		if(client.parent){
			client.parent.disconnect();
		}
	});
	
});


function route(parcel,source){
	var dst=findLink([source,parcel.edge]);
	
	if(dst){
		parcel.edge=dst[1];
		spaces[dst[0]].sendJSON(parcel);
	}
}

//takes [id,edge] and returns [id,edge] of linked edge
function findLink(lin){
	for(var i in links){
		if(links[i][0][0]==lin[0] && links[i][0][1]==lin[1]){
			return links[i][1];
		}else if(links[i][1][0]==lin[0] && links[i][1][1]==lin[1]){
			return links[i][0];
		}
	}
	return 0;
}

function addLink(link){
	
	//check if valid!!! NO REALLY! DO IT.
	
	if(spaces[link[0][0]] && spaces[link[1][0]] ){
		
		spaces[link[0][0]].links[link[0][1]]=1; //open the edges
		spaces[link[1][0]].links[link[1][1]]=1;

		links.push(link);
		
		spaces[link[0][0]].sendLinks();
		spaces[link[1][0]].sendLinks();
		
	}
}

function removeLink(id){
	var link=links[id];
	
	spaces[link[0][0]].links[link[0][1]]=0; //close the edges
	spaces[link[1][0]].links[link[1][1]]=0;
	
	links.splice(id,1);
	
	spaces[link[0][0]].sendLinks();
	spaces[link[1][0]].sendLinks();
	
	tellMasters();
}

function broadcast(data){
	for(var i in spaces){
		if(spaces[i]){
			spaces[i].sendJSON(data);
		}
	}
}

function tellMasters(){
	//console.log(masters);
	
	for(var i in masters){
		if(masters[i]){
			masters[i].sendSpaceInfo();
			//masters[i].sendJSON(data);
		}
	}
}


function Space(client_){
	var client=client_;
	
	client.parent=this;
	
	var address=client.connection.remoteAddress;	

	
	var arry=address.split('.');
	var product=arry[0]*arry[1]*arry[2]*arry[3]+'';
	
	var revProduct='';
	for(var i in product){
		revProduct=product[i]+revProduct;
	}
	
	//rp=revProduct;
	
	this.hue=(revProduct/1000)%360;


	// make remy purple
	if(address=='130.58.193.107') this.hue=268;
	
	
	//console.log('space '+id+' connected. ('+address+')');	

	var id=nextID++;
	
	spaces[id]=this;
	
	console.log('space '+id+' connected. ('+address+')');	
	
	this.links=[0,0,0,0];
	
	var width=0,height=0;

	this.handleMessage=function(data){
								
		if(data.dims){
			width=data.dims[0];
			height=data.dims[1];
			needUpdate=true;			
			tellMasters();
		}
		
		if(data.message){
			broadcast(data);
		}
		
		if(data.ball){
			route(data,id);
		}
		
		if(data.linking!=undefined){
			
			//three options:
			//  unlink if edge is already linked
			//  make link, else
			
			//  ignore if second edge is already selected
			
			if(pendingLink){				
				addLink([pendingLink,[id,data.linking]]);
				
				tellMasters();
				pendingLink=false;
			}else{

				var theLink=-1;

			//	for(var l=links.length-1;l>=0;l--){
				for(var l in links){
					//console.log('checking link '+l);

					if((links[l][0][0]==id && links[l][0][1]==data.linking) ||
					   (links[l][1][0]==id && links[l][1][1]==data.linking)){
					   	
					    theLink=l;
					}
				}
				
				if(theLink==-1){
					pendingLink=[id,data.linking];
				}else{
					removeLink(theLink);
				}
			}
		}

	}
	
	this.disconnect=function(){
		
		for(var i=links.length-1;i>=0;i--){
			var link=[];
			//we'll delete the links
			if(links[i][0][0]==id){
				link=links[i][1];
			}
			if(links[i][1][0]==id){
				link=links[i][0];
			}
			if(link.length){
				spaces[link[0]].links[link[1]]=0;
				spaces[link[0]].sendLinks();
				links.splice(i,1);
			}
		}
		
		for(var i in spaces){
			if(spaces[i]==this){
				spaces[i]=null;
				//spaces=spaces.splice(i,1);
				console.log('space '+id+' disconnected.');
			}
		}
		
		tellMasters();
	}
	
	this.info=function(){
		return {
			'id':id,
			'width':width,
			'height':height,
			'address':address,
			'hue':this.hue
		}
	}
	
	this.sendJSON=function(data){
		client.sendJSON(data)
	}

	client.sendJSON({'id':id,'address':address,'hue':this.hue});
	
	this.sendLinks=function(){
		
		var hues=[];
		
		for(var i=0;i<4;i++){
			var lin=findLink([id,i]);
			if(lin && spaces[lin[0]])
				hues[i]=spaces[lin[0]].hue;
		}
		client.sendJSON({'links':this.links,'hues':hues});
	}
}

function Master(client_){
	var client=client_;
	
	client.parent=this;

	console.log('we gained a master.');	

	this.handleMessage=function(data){
		if(data.link){
			addLink(data.link);
			
			tellMasters();
		}
		
		if(data.unlink){
			removeLink(data.unlink);
		}
		if(data.global){
			broadcast(data);
		}
	}
	
	this.disconnect=function(){
		for(var i=masters.length-1;i>=0;i--){
			if(masters[i]==this){
				masters.splice(i,1);
				console.log('we lost a master.');	
			}	
		}
	}
	
	this.sendSpaceInfo=function(){
		var data={};
		
		data.spaces={};
		
		for(var i in spaces){
			if(spaces[i]){
				data.spaces[i]=spaces[i].info();
			}
		}
		
		data.links=links;
		
		//console.log(JSON.stringify(data));
		//console.log(data);
		
		client.sendJSON(data);
	}

	masters.push(this);
	
	this.sendSpaceInfo();
}
