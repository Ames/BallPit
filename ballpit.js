
var socketPort=8124;

//var socketPath=window.location.protocol+"//"+window.location.hostname+":"+socketPort+'/';

var socketHost='login.sccs.swarthmore.edu';

var socketPath='http://login.sccs.swarthmore.edu:8124/';


//WEB_SOCKET_SWF_LOCATION=socketPath+'socket.io/lib/vendor/web-socket-js/WebSocketMainInsecure.swf';
//WEB_SOCKET_SWF_LOCATION=socketPath+'socket.io/lib/vendor/web-socket-js/WebSocketMain.swf';

var scr=document.createElement('script');
scr.src=socketPath+'socket.io/socket.io.js';
//document.appendChild(scr);


//mozilla
if(!document.head)document.head=document.getElementsByTagName('head')[0];

document.head.appendChild(scr);

var container;
var headDiv;
var socket;
var textInput;
var msgDiv;
var chatterDiv;
var notDiv;
var ui;

var id=0;

var balls=[];

var links=[0,0,0,0];
var hues=[0,0,0,0];

var dims={'w':0,'h':0};

var mouse0=false;

var gravityX=0;
var gravityY=.5;

var friction=.005;
//var frictionT = 0;

var defRad=15;

var loadedThings=0;

var edgeTabs=[];

var showTabs=true;

var showUI=false;

var address='';
var hue=0;

var ballColor='';
var bgColor='';

var run=true;

var notify = 0;


//var Universal = 0;
//var gConst = 100;
var gConst = 0;

var hasAccel=false;
var useAccel=true;

//var hasOrientation=('ondeviceorientation' in window);

var ie=(navigator.appName == 'Microsoft Internet Explorer');

var uiGravX,uiGravY,uiFrict,uiGrav;

function init(){
	//	alert('loaded document!');	

	loadedThings++;
	if(loadedThings!=2)return true;


	textInput=document.getElementById('textInput');
	headDiv=document.getElementById('header');
	msgDiv=document.getElementById('messages');
	chatterDiv=document.getElementById('chatterBox');
	notDiv=document.getElementById('msgNote');
	
	container=(document.getElementById('container'));
	ui=(document.getElementById('ui'));
//    var paper = Raphael("canvas","100%","100%");
//    var c = paper.circle(50,50,40);
	if(window.webkitNotifications){
	    container.onclick=requestPop;   //?!
	}

	initSocket();


	for(var i=0;i<4;i++){
		edgeTabs[i]=new EdgeTab(i);	
	}
		
	window.onresize=resize;
	document.onmousedown=mouseDown;
	document.onmouseup=mouseUp;
	
	//document.onkeydown=keyDown;
	document.onkeydown=keyDown;
	
	
	if(!ie) container.addEventListener("touchmove", touchMove, false);


	notDiv.onclick=clickNotify;
	if(!ie) notDiv.addEventListener("touchstart", clickNotify, false);

	
//	setInterval('step()',50); //20fps
	setInterval('step()',40); //25fps
//	setInterval('step()',30); //33fps
//	setInterval('step()',20); //50fps

	setInterval('keepAlive()',5000); //5 seconds
	//setInterval('notifyDisplay()',1000);
	
	//new Ball(100,200,6,4);
	
	resize();
	
	uiFrict=new UI('friction ',[0,.2],function(v){friction=v*1;});
	uiFrict.set(friction);
	
	uiGrav=new UI('gravitation ',[-1000,1000],function(v){gConst=v*1;});
	uiGrav.set(gConst);
	
	uiGravX=new UI('gravityX ',[-2,2],function(v){
		gravityX=v*1;
		useAccel=false;
		if(accelUI)accelUI.set(useAccel);
	});
	
	uiGravX.set(gravityX);

	uiGravY=new UI('gravityY ',[-2,2],function(v){
		gravityY=v*1;
		useAccel=false;
		if(accelUI)accelUI.set(useAccel);
	});
	uiGravX.set(gravityX);

	
	new UI('freeze ',1,function(){freeze()});

	toggleUI();
	toggleUI();
}

function chGrav(){
	if(uiGravX){
		uiGravX.set(gravityX);
		uiGravY.set(gravityY);
	}
}

function initSocket(){
	
	if(socket){
		socket.disconnect();
		socket.socket.connect();
	}
	
	//["websocket", "flashsocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"]
	//var transports=["websocket","flashsocket"];
	var transports=["websocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"];
	//var transports=["websocket", "htmlfile", "xhr-multipart", "jsonp-polling"];
	//var transports=["htmlfile", "xhr-multipart", "jsonp-polling"];
	
	//if(WebSocket)var transports=["websocket"];
	
	//force opera to use flashsocket
//	if(io.util.opera) transports=["flashsocket"];
	
//	socket = io.connect(socketHost+":"+socketPort);

	socket = io.connect(socketHost+":"+socketPort,{'transports':transports,
	     'rememberTransport':false});
	     
//	socket = new io.Socket(socketHost,{'port':socketPort,'transports':transports,
//	     'rememberTransport':false});

		
	//this should only be done once!
	if(!socket.$events){
		socket.on('connect',handleConnect);
		socket.on('message',handleMessage);
		socket.on('disconnect',handleDisconnect);
	}
	
	socket.sendJSON=function(data){
		if(socket.socket.connected){
			this.send(JSON.stringify(data));
		}
	}
	
//	socket.connect();
}


function toggleUI(show){
	showUI=(show==undefined)?!showUI:show; //toggle if no input
	
	ui.style.visibility=showUI?'visible':'hidden';
}


function UI(title,type,callback){ //type: 0=checkbox, 1=button, [min,max]=slider
	
	var div=document.createElement('div');
	
	ui.appendChild(div);
	
	if(type==0){ //ckeckbox
	
		var label=document.createElement('span');
		label.innerHTML=title;
		
		div.appendChild(label);
	
		var check=document.createElement('input');
		check.type='checkbox';
		div.appendChild(check);
		
		check.onchange=function(){
			if(callback){
				callback(check.value);
			}
		}
		
		this.set=function set(v){
			check.checked=v;
		}

	
	}else if(type==1){ //button
		var but=document.createElement('input');
		but.type='button';
		
		but.value=title;
		div.appendChild(but);
		
		but.onclick=function(){
			if(callback){
				callback();
			}
		}
		this.set=function set(){
			but.onclick();
		}
		
	}else if(type.length && type.length==2){ //slider
		var label=document.createElement('span');
		label.innerHTML=title;
		
		div.appendChild(label);
	
		var txt=document.createElement('input');
		txt.type='text';
		div.appendChild(txt);
	
		var range=document.createElement('input');
		range.type='range';
		range.min=type[0];
		range.max=type[1];
		range.step='any';
		div.appendChild(range);
		
		txt.onchange=function(){
			range.value=txt.value;
			if(callback){
				callback(txt.value);
			}
		}
		range.onchange=function(){
			txt.value=range.value;
			if(callback){
				callback(range.value);
			}
		}
		
		this.set=function set(v){
			txt.value=v
			range.value=v;
		}
		
	}
}



function showChatters(chatters){
	
	var newHTML='';
	
	for(i in chatters){
		var col='hsl('+chatters[i][1]+', 70%, 60%)';

		newHTML+='<div title="'+chatters[i][0]+'" style="background-color:'+col+'"></div>';
	}
	
	chatterDiv.innerHTML=newHTML;
}

function clickNotify(){
	notify=0;
	notifyDisplay();
	
	showMsg=false;
	toggleMsg();
}

function notifyDisplay(){
    setFavCol(ballColor,notify);
	if(!notify){
		notDiv.style.visibility = "hidden";
	}
	else{
		notDiv.style.visibility="visible";
	}
}

function keepAlive(){
	if(!socket.socket.connected){
		initSocket();
		//socket.connect();	
	}
}

scr.onload=init;
window.onload=init;

if(ie){
 	setTimeout("init()",2000);
}

function handleConnect(){
	headDiv.innerHTML="";
	links=[0,0,0,0];
	upTabs();
	socket.sendJSON({'declare':'space'});
	resize();
}

function handleDisconnect(){
	headDiv.innerHTML="";
	links=[0,0,0,0];
	upTabs();
}

function handleMessage(msg){
	
	//console.log(msg);

	var data=JSON.parse(msg);

	if(data.message){
		//var msgTxt=+';
		var col='hsl('+data.hue+', 70%, 60%)';
		if(/*col!=ballColor && */!showMsg){
			notifyPop(data,col)
			notify+=1;
			notifyDisplay();
		}
		
		
		var newMsg=document.createElement('div');
		
		newMsg.title=data.address;
		
		newMsg.innerHTML='<div class="marker" style="background-color:'+col
		          +'"></div>'+unescape(data.message);
		
		msgDiv.insertBefore(newMsg,msgDiv.firstChild)
	}
	
	if(data.id){
		id=data.id;
		headDiv.innerHTML=data.id;

	
		if(data.address){
			address=data.address;
		}
		
		if(data.hue){
			ballColor='hsl('+data.hue+', 70%, 60%)';
			bgColor='hsl('+data.hue+', 100%, 95%)';
			notDiv.style.backgroundColor =ballColor;
			container.style.backgroundColor=bgColor;
			
			setFavCol(ballColor);
		}
	}
	
	if(data.hues){
		hues=data.hues;
		upTabs();
	}
	
	if(data.links){
		links=data.links;
		upTabs();
	}
	

	if(data.global){
		if(data.global.k) spawnBalls();
		if(data.global.f) freeze();
		if(data.global.x) clear();
	}
	
	if(data.ball){
		
		//var b=JSON.parse(data.ball);
		var b=data.ball;
		
		var x,y,vx,vy;
		switch(data.edge){
			case 0: x=(1-b.loc)*dims.w; y=0; vx=-b.vel[1]; vy= b.vel[0]; break;	
			case 1: x=0; y=(b.loc)*dims.h; vx= b.vel[0]; vy= b.vel[1]; break;	
			case 2: x=(b.loc)*dims.w; y=dims.h;vx= b.vel[1]; vy=-b.vel[0]; break;	
			case 3: x=dims.w; y=(1-b.loc)*dims.h;vx=-b.vel[0]; vy=-b.vel[1]; break;
		}
		new Ball(x,y,vx,vy,data.ball.r,data.ball.color,data.ball.type);
	}
	
	if(data.pending!=undefined){
		edgeTabs[data.pending].setState(2);
	}
	
	if(data.chatters){
		showChatters(data.chatters);
	}
}

function resize(){
	
	if(container){
		//mozilla:
		dims.h=container.clientHeight;
		dims.w=container.clientWidth;
		
	//	dims.w=document.width;	
	//	dims.h=document.height;
		
		socket.sendJSON({'dims':[dims.w,dims.h]});
	}
	
	if(msgDiv){
		msgDiv.style.maxHeight=dims.h-100+'px';
		//messages.scrollTop=0; //do we want to scroll to top?
	}
}

var E;

function handleText(e){

		textInput=document.getElementById('textInput');

		sendMessage(escape(textInput.value));
		textInput.value="";
}

function sendMessage(msg){
	socket.sendJSON({'message':msg});
}

var E;
function mouseDown(e){
	//E=e;
	if (!e) var e = window.event;
	
	if(e.target.id=='container'){
		mouse0=[e.clientX,e.clientY];
	}
}

function mouseUp(e){
	if (!e) var e = window.event;
	
	if(e.target.id=='container'){	
		new Ball(e.clientX,e.clientY,(e.clientX-mouse0[0])*.1,(e.clientY-mouse0[1])*.1);
	}
}

function handleMozOrientation(e){
	accelYes();
	if(useAccel){
		gravityX=e.x;
		gravityY=e.y;
		
		chGrav();
	}
}

window.addEventListener("MozOrientation", handleMozOrientation, true);

window.ondeviceorientation=function(e){
	accelYes();
	if(useAccel){
		gravityY=e.beta/90;
		gravityX=e.gamma/90;
		
		chGrav();
	}
}

function accelYes(){
	if(!hasAccel && ui){
		hasAccel=true;
		accelUI=new UI('accelerometer ',0,function(v){useAccel=v});
		accelUI.set(useAccel);
	}
}

var avgShake=0;


var accX=0;
var accY=0;
var accZ=0;

if(!ie){
	window.addEventListener("devicemotion", function(event) {
		// Process event.acceleration, event.accelerationIncludingGravity,
		// event.rotationRate and event.interval
		
//		var txt="";
//		
//		for(var i in event){
//			txt+=i+": "+event[i]+"<br>";	
//			
//		}
//		
//		txt+="<br>";
//		
//		for(var i in event.accelerationIncludingGravity){
//			txt+=i+": "+event.accelerationIncludingGravity[i]+"<br>";	
//			
//		}
//		
//		headDiv.innerHTML=txt;

		
		//if(event.accelerationIncludingGravity){

			accX = event.accelerationIncludingGravity.x;
			accY = event.accelerationIncludingGravity.y;
			accZ = event.accelerationIncludingGravity.z;
			
		if(useAccel){
			gravityX=accX/10;
			gravityY=-accY/10;
			
			chGrav();


		}
			
		//}
		if(!accX){
			accX = 0;
		}
		if(!accY){
			accY = 0;
		}
		if(!accZ){
			accZ = 0;
		}
		avgShake=(avgShake*9+Math.dist(accX,accY,accZ))/10;
		
		//message(avgShake);
	
		//document.body.style.backgroundColor="#"+parseInt(avgShake*16, 16)+"0000";
		
		if(avgShake>12){
			
			for(var i in balls){
				balls[i].remove();
			}
			balls=[];
		}
	}, true);
}

function Ball(xi,yi,vxi,vyi,ri,color,type,density){
	
	this.x=xi;
	this.y=yi;
	this.vx=vxi;
	this.vy=vyi;
	
	this.dx=this.dy=0;
	
	this.type=type||'ball';
	
	this.color=color||ballColor;
	
	var zombieColor='rgb(67,67,67)';
	
	var pacSpeed=7;
	
	this.r=ri || defRad;
	
	this.density=.001||density;
	
	this.m=Math.PI*this.r*this.r*this.density;
	
	this.div=document.createElement('div');
	this.div.className='ball';
	
	this.div.style.backgroundColor=this.color;
	
	if(this.type=='pac'){
	   	this.div.className='pac';
        
	   	this.div.style.backgroundColor='';
	   	
	   	this.div.innerHTML="<div class='pacA1'><div class='pacA2'></div></div><div class='pacB1'><div class='pacB2'></div></div>";
	}
	
    container.appendChild(this.div);

	this.removed=false;
	

	this.step=function step(){
		
		//plague
		if(this.infected){
			this.setR(this.r-.5);
			this.m = Math.PI*this.r*this.density;
			if(this.r<4)this.remove();
		}
		
		//gravity
		this.vx+=gravityX;
		this.vy+=gravityY;
		
		this.vx*=1-friction;
		this.vy*=1-friction;
		
		
//		if(Universal){
//		    for(var i = 0;i<balls.length;i++){
//		        if(balls[i]!=this){
//		            this.fG(balls[i]);
//		        }
//		    }
//		}
//		
		
		if(this.type=='pac'){
			
			var near=this.nearestBall();
			
			var nx, ny;
			
			if(near){
				nx=near.x;
				ny=near.y;
				
				
				var dst=Math.dist(this.x-near.x,this.y-near.y);
				
				if(dst!=0){
					this.vx=(10*this.vx+(near.x-this.x)/dst*pacSpeed)/11;
					this.vy=(10*this.vy+(near.y-this.y)/dst*pacSpeed)/11;
				}
				
			}
		}
		
		
		this.x+=this.vx;
		this.y+=this.vy;
		
		
		//walls
		if(links[0]){
			if(this.y<0)this.send(0);
		}else{
			if(this.y<this.r){this.vy*=-1;this.y=this.r;}
		}
		
		if(links[1]){ if(this.x<0)this.send(1);
		}else{ if(this.x<this.r){this.vx*=-1;this.x=this.r;};}

		if(links[2]){ if(this.y>dims.h)this.send(2);
		}else{ if(this.y>dims.h-this.r){this.vy*=-1;this.y=dims.h-this.r;};}

		if(links[3]){ if(this.x>dims.w)this.send(3);
		}else{ if(this.x>dims.w-this.r){this.vx*=-1;this.x=dims.w-this.r;};}
		
	}
	
	this.nearestBall=function(){
		var min=100000;
		var imin=-1;
		
		
		for(var i in balls){
			var b=balls[i];
			
			var d=Math.dist(this.x-b.x,this.y-b.y);
			
			if(d<min && b!=this){
				min=d;
				imin=i;
			}
		}
		if(imin!=-1){
			return balls[imin];
		}else{
			return false;	
		}
	}

	this.fG = function fG(p2){
		
	    var min=this.r+p2.r;
	    min*=min*min; //min^3
	    
	    var dx=this.x-p2.x,
	        dy=this.y-p2.y,
	    
	        dd=dx*dx+dy*dy,
	    
	        ddd=dd*Math.sqrt(dd); //d^3
	   	
	   	
	    ddd=(ddd>min)?ddd:min; //use the greater of ddd, min

	    var f = (p2.m*gConst)/(ddd);
	    
	    this.vx-=f*dx;
	    this.vy-=f*dy;

/*
		f = this.m*p2.m*gConst;
	    r = Math.pow((this.x-p2.x),2)+Math.pow((this.y-p2.y),2)||1;
	    f = f/r; 
	    ang = Math.atan2(p2.y-this.y,p2.x-this.x);
	    this.vy += f*Math.sin(ang)/this.m;
	    this.vx += f*Math.cos(ang)/this.m;
*/

	}
	
	this.send=function send(edge){
		
		if(this.removed)return;
		
		var loc,vel;
		switch(edge){
			case 0: loc=  this.x/dims.w; vel=[-this.vy, this.vx]; break;	
			case 1: loc=1-this.y/dims.h; vel=[-this.vx,-this.vy]; break;	
			case 2: loc=1-this.x/dims.w; vel=[ this.vy,-this.vx]; break;	
			case 3: loc=  this.y/dims.h; vel=[ this.vx, this.vy]; break;	
		}
		
		parcel={};
		parcel.edge=edge;
//		parcel.ball={
//			'loc':loc,
//			'vel':vel,
//			'r':this.r,
//			'color':this.color,
//			'type':this.type //more to come...
//		};
		
		var ballObj={
			'loc':loc,
			'vel':vel,
			'r':this.r,
			'color':this.color,
			'type':this.type //more to come...
		};
		
		//parcel.ball=JSON.stringify(ballObj);
		parcel.ball=ballObj;
		
		socket.sendJSON(parcel);
		
		this.remove();
	}
	
	//this happens a lot  -  it's really slow.
	
	var useTransform=false;
	
	if(useTransform){
		this.div.style.top='0px';
		this.div.style.left='0px';
	}
	
	this.upLoc=function upLoc(){
		
		this.x+=this.dx;
		this.y+=this.dy;
		
		this.dx=this.dy=0;
		
//		this.div.style.top=this.y-this.r+'px';
//		this.div.style.left=this.x-this.r+'px';
		
		if(useTransform){
			this.div.style.setProperty('-webkit-transform','translate('+Math.round(this.x-this.r)+'px, '+Math.round(this.y-this.r)+'px)');
		}else{
			this.div.style.top=Math.round(this.y-this.r)+'px';
			this.div.style.left=Math.round(this.x-this.r)+'px';
		}
		
		if(this.type=='pac'){
			var a=Math.atan2(-this.vy,-this.vx);
			this.div.style.setProperty('-webkit-transform','rotate('+a+'rad)',"");	
			this.div.style.setProperty('-moz-transform','rotate('+a+'rad)',"");	
		}
		
	}
	
	this.setR=function setR(newR){
		this.r=newR;
		this.m=Math.PI*this.r*this.r*this.density;
		this.div.style.width=Math.round(this.r*2)+'px';
		this.div.style.height=Math.round(this.r*2)+'px';
	}
	
	this.remove=function remove(){
		if(!this.removed){
			this.removed=true;
			container.removeChild(this.div);
		}
	}
	
	
	balls.push(this);
	
	this.upLoc();
	this.setR(this.r);
	
	//this happens a lot too
	this.doCollide=function doCollide(p){
		
		//faster?
		//if((p.x-this.x)*(p.x-this.x)+(p.y-this.y)*(p.y-this.y)<(p.r+this.r)*(p.r+this.r)){
		
		var p1=this;
		var p2=p;
		
		var dx = p2.x-p1.x; //dist
		var dy = p2.y-p1.y;
		
		
		//faster?
		if((dx*dx+dy*dy)<((p1.r+p2.r)*(p1.r+p2.r))){
		
			var dm=Math.dist(dx,dy); //dist mag

			//if(dm<(p1.r+p2.r)){


			if(p1.infected && !p2.infected)p2.infect();
			if(p2.infected && !p1.infected)p1.infect();
			
			if(p1.type=='pac')p1.tryEat(p2);
			if(p2.type=='pac')p2.tryEat(p1);

			
		
			if(!dm)dm+=.001; //don't divide by 0 :)

			var dxu=dx/dm;  //dist unit
			var dyu=dy/dm;
			
			var vn1 = p1.vx*dxu + p1.vy*dyu;
			var vn2 = p2.vx*dxu + p2.vy*dyu;
									
			var vom=(vn2-vn1)/(p1.m+p2.m)*2;// v/m
			
			p1.vx+=vom*dxu*p2.m;
			p1.vy+=vom*dyu*p2.m;
			
			p2.vx-=vom*dxu*p1.m;
			p2.vy-=vom*dyu*p1.m;
 
 
 
 			//this is problematic!//
 			
			//uncollide
			var dma = dm-p1.r-p2.r;//adjusted for radius
 
			p1.dx+=(dma*dxu)/2;
			p1.dy+=(dma*dyu)/2;
			
			p2.dx-=(dma*dxu)/2;
			p2.dy-=(dma*dyu)/2;
//			
//			p1.x+=(dma*dxu)/2;
//			p1.y+=(dma*dyu)/2;
//			
//			p2.x-=(dma*dxu)/2;
//			p2.y-=(dma*dyu)/2;
			

		}
	}
	
	this.infect=function infect(){
		this.infected=true;
		this.color=zombieColor;
		
		if(this.type=='pac'){
			this.div.childNodes[0].firstChild.style.background=this.color;
			this.div.childNodes[1].firstChild.style.background=this.color;
		}else{
			this.div.style.backgroundColor=this.color;
		}
		
		this.type='plagued';

	}
	
	this.tryEat=function(p){
		var angle=Math.atan2(this.y-p.y,this.x-p.x);
		var myAngle=Math.atan2(-this.vy,-this.vx);
		
		var dangle=Math.abs(myAngle-angle);
		
		if(dangle<Math.PI/6 && !this.removed){ //no eating if you're dead.
			p.remove();	
		}
		
	}
	
	if(this.type=='plagued'){
		this.infect();	
	}

}

function step(){
				
	//collisions!
	
	if(run){
	
		if(gConst)
			for(var i in balls)
				for(var j in balls)
					if(i!=j)
						balls[i].fG(balls[j]);
	
		for(var i in balls)balls[i].step();

		//for each particle
		for(var i1 in balls){
			// for each particle farther in the list (upper right triangle)
			for(var i2=i1;i2<balls.length;i2++){
				//if not on the diagonal
				if(i1!=i2){
					//calculate collision
					balls[i1].doCollide(balls[i2],i2);
				}
			}
		}
		
		for(var i in balls)balls[i].upLoc();

//		for(var i in balls){
//			balls[i].step();
//			balls[i].upLoc();	
//		}
		
		
		//clean up dead balls
		for(var i=balls.length-1;i>=0;i--){
			if(balls[i].removed){
				balls.splice(i,1);
			}
		}
	
	}
}

function spawnBalls(){		
	var nParts=10;
	for(var i=1;i<nParts;i++){
		new Ball(Math.random()*dims.w,
	             Math.random()*dims.h,
	             Math.random()*10-5,
	             Math.random()*10-5,
	             
	             Math.random()*defRad/3*2+defRad/3);
	}
}


function spawnBurst(){
	var nParts=100;
	
	for(var i=0;i<nParts;i++){
		var r=Math.random()*dims.w/10;
		var t=Math.random()*Math.PI*2;
		
		new Ball(r*Math.cos(t)+dims.w/2,
	             r*Math.sin(t)+dims.h/2,
	             r*Math.cos(t)*.5,
	             r*Math.sin(t)*.5,
	             Math.random()*defRad/3*2+defRad/3);
	}
}


function clear(){
	for(i in balls){
		balls[i].remove();
	}
	balls=[];
}

function toggleTabs(show){
	showTabs=!showTabs;
	if(showTabs){
		for(var i in edgeTabs)edgeTabs[i].show();
	}else{
		for(var i in edgeTabs)edgeTabs[i].hide();
	}
}

var showMsg=true;

function toggleMsg(){
	showMsg=!showMsg;
	if(showMsg){
		document.getElementById('msgBox').style.visibility='visible';
		textInput.focus();
		notify = 0;
		notifyDisplay();
	}else{
		document.getElementById('msgBox').style.visibility='hidden';
		textInput.blur();
	}
}

function upTabs(){
	for(var i in edgeTabs){
		edgeTabs[i].setHue(hues[i]);
		edgeTabs[i].setState(links[i]);
	}
}

//a class
function EdgeTab(edge){
	//edge is 0,1,2,3
	
	var width =120;
	var length=150;
	
	var pos=0;

	var w,h,t,l,m1=-width/2,m2=0; //m1=width, m2=length
	
	this.edge=edge;
	
	var horiz=edge%2; //1,3
	var far=edge>1;   //2,3
	
	var w=horiz?length:width;
	var h=horiz?width:length;
	
	var l=horiz?far?100:0:50;
	var t=horiz?50:(far?100:0);
	
	//div is the actual tab
	this.div=document.createElement('div');
	this.div.className='edgeTab';
	container.appendChild(this.div);
	
	this.div.style.zIndex=2;
	this.div.style.width=w+'px';
	this.div.style.height=h+'px';
	this.div.style.top=t+'%';
	this.div.style.left=l+'%';
	
	this.setPos=function(newPos){
		pos=newPos||pos;
		
		m2=-length*(far?pos:1-pos);
		
		this.div.style.marginTop=(horiz?m1:m2)+'px';
		this.div.style.marginLeft=(horiz?m2:m1)+'px';
	}
	
	//div2 is for the shadow
	this.shadow=document.createElement('div');
	this.shadow.className='edgeShadow';
	container.appendChild(this.shadow);
		
	this.shadow.style.width=horiz?'0px':'100%';
	this.shadow.style.height=horiz?'100%':'0px';
	this.shadow.style.top=(horiz?0:(far?100:0))+'%';
	this.shadow.style.left=(horiz?(far?100:0):0)+'%';
	
	
	
	//backgound, border, pos
	var styles=[
		['#DDD','#AAA', .6],         //unlinked
		['#A699E5','#815DE9', .35],   //linked //linked will get a special color
		['#888','#222', .75]];  //selected

	//backgound, border, pos
//	var styles=[
//		['#DDD','#AAA', .65],         //unlinked
//		['#A699E5','#815DE9', .35],   //linked
//		['#FE8880','#FD2720', .8]];  //selected

	
	this.setHue=function(hue){
		//ballColor='hsl('+hue+', 70%, 60%)';
		//bgColor='hsl('+hue+', 100%, 95%)';

		styles[1][0]='hsl('+hue+', 100%, 80%)';	
		styles[1][1]='hsl('+hue+', 70%, 50%)';
	}

	//state: 
	this.setState=function(state){
		
		//alert('ho!');
		
		this.state=state;
	
		if(!ie){
			this.div.style.backgroundColor=styles[this.state][0];
			this.div.style.borderColor=styles[this.state][1];
		}
	
		this.setPos(styles[this.state][2]);
		
		if(this.state!=0){
			this.shadow.style.setProperty('-webkit-box-shadow',styles[this.state][1]+' 0px 0px 15px 4px',null);		
			this.shadow.style.setProperty(   '-moz-box-shadow',styles[this.state][1]+' 0px 0px 15px 4px',null);		
		}else{
			this.shadow.style.setProperty('-webkit-box-shadow','none',null);		
			this.shadow.style.setProperty(   '-moz-box-shadow','none',null);		
		}
	}
	
	this.hide=function(){
		this.div.style.visibility='hidden';
	}
	this.show=function(){
		this.div.style.visibility='visible';
	}
	
	this.setState(0);
	
	
	this.click=function(){
		//talk to server
		
		socket.sendJSON({'linking':this.edge});	

//		if(this.state==0){
//			this.setState(2);
//		}

	//	balls[balls.length-1].remove();
//		
//		this.state--;
//		
//		if(this.state==-1)this.state=2;
//		
//		this.setState(this.state)
	}
	
	var self=this;

	this.div.onclick=function(e){
		self.click();
		//E=e;
	}
	
	this.div.touchStart=function(e){
		self.click();
	}
}

touchMove=function(e){
	
	e.preventDefault();
	
	//message(e);
	
	for(var i=0;i<e.changedTouches.length;i++){
		var touch=e.changedTouches[i];
		
		new Ball(touch.clientX,touch.clientY,0,0,Math.random()*defRad/3*2+defRad/3);	
	}
	
//	return false;
}

var E;


var konami=[38,38,40,40,37,39,37,39,66,65,13];
var kSeq=0;

function doKonami(){
	//very similar to spawnBurst()
	
	var nParts=180;
	
	for(var i=0;i<nParts;i++){
		
		var r=15*(i%6)+40;
		var t=Math.PI*2/nParts*i;
		
		
		//var r=Math.random()*dims.w/100;
		//var t=Math.random()*Math.PI*2;
		
		//		new Ball(x,y,vx,vy,data.ball.r,data.ball.color,data.ball.type);

		new Ball(r*Math.cos(t)+dims.w/2,
	             r*Math.sin(t)+dims.h/2,
	             ((i%2)*2-1)*r*Math.sin(t)*.03,
	             -((i%2)*2-1)*r*Math.cos(t)*.03,
	             (i%6)*.5+4,
	             'hsl('+t/Math.PI*180+',80%, 50%)'/*,'plagued'*/);
	}
}

function keyDown(e){
	if (!e) var e = window.event;

	var dG=.025;

	//E=e;
	
	if(e.target.tagName != 'INPUT' || e.which==27){

		var code;
		if (e.keyCode) code = e.keyCode;
		else if (e.which) code = e.which;	//lastEvent=e;
		
		if(code==konami[kSeq]){
			kSeq++;
			if(kSeq==11){
				kSeq=0;
				doKonami();	
			}
			if(code>60)code=0; //cancel for b and a
		}else{
			kSeq=0;
		}
		
		//message(e.keyCode)
		switch(code){
			
			case 32: //space
				run=!run;
				break;
			case 27: //esc
				toggleMsg();
				break;
			case 76: //l
				spawnBurst();
				break;
			case 75: //k
				spawnBalls();
				break;
			case 88: //x
				clear();
				break;
//			case 85: //u
//			    if(Universal){
//			        Universal = 0;
//			    }else{
//			        Universal = 1;
//			    }
//			    t = frictionT;
//			    frictionT = friction;
//			    friction = t;
//			    
//				uiFrict.set(friction);
//			    break;
				
			case 38: //up
				gravityY-=dG;
				chGrav();

				break;

			case 40: //down
				gravityY+=dG;
				chGrav();

				break;
				
			case 39: //right
				gravityX+=dG;
				chGrav();
				break;
				
			case 37: //left
				gravityX-=dG;
				chGrav();

				break;
			 case 70: //f
				freeze();
				break;
			case 65: //a
				useAccel=!useAccel;
				if(accelUI)accelUI.set(useAccel);
				break;
			 case 71: //g
				gravityX=0;
				gravityY=0;

				chGrav();


				break;
			 case 191: // /
				toggleTabs();
				break;
			case 73: //i
				
				if(balls.length){
					balls[Math.round(Math.random()*(balls.length-1))].infect();
				}

				break;
				
			case 52: //4
			case 48: edgeTabs[0].click(); break; //0
			case 49: edgeTabs[1].click(); break; //1
			case 50: edgeTabs[2].click(); break; //2
			case 51: edgeTabs[3].click(); break; //3
			
			case 219: // [
				friction-=.001;
				if(friction<0)friction=0;
				
				uiFrict.set(friction);

				break;
			case 221: // ]
				friction+=.001;
				uiFrict.set(friction);
				break;
			case 90: // z
				toggleUI();
				break;
			case 80: // p
				new Ball(dims.w/2,dims.h/2,0,0,60,"",'pac')
				break;
		}
	}

}

function freeze(){
	for(i in balls){
		balls[i].vx=0;	
		balls[i].vy=0;	
	}	
}

Math.dist=function(a,b){
	return Math.sqrt(a*a+b*b);
}

function notifyPop(msg,col){
	if(webkitNotifications){
	    var title = msg.address;
	    var text = unescape(msg.message);
	    var popup = window.webkitNotifications.createNotification(genCol(col),title,text);
	    popup.show();
	    setTimeout(function(){
	    popup.cancel();
	    }, '7000');
	}
}

function requestPop(){
    if(window.webkitNotifications.checkPermission()==1){
        window.webkitNotifications.requestPermission();
    }
}
