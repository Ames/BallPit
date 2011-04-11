
var socketPort=8124;

//var socketPath=window.location.protocol+"//"+window.location.hostname+":"+socketPort+'/';

var socketHost='login.sccs.swarthmore.edu';

var socketPath='http://login.sccs.swarthmore.edu:8124/';


//WEB_SOCKET_SWF_LOCATION=socketPath+'socket.io/lib/vendor/web-socket-js/WebSocketMainInsecure.swf';
WEB_SOCKET_SWF_LOCATION=socketPath+'socket.io/lib/vendor/web-socket-js/WebSocketMain.swf';

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
var notDiv;

var id=0;

var balls=[];

var links=[0,0,0,0];
var hues=[0,0,0,0];

var dims={'w':0,'h':0};

var mouse0=false;

var gravityX=0;
var gravityY=.5;

var friction=.005;

var defRad=15;

var loadedThings=0;

var edgeTabs=[];

var showTabs=true;

var address='';
var hue=0;

var ballColor='';
var bgColor='';

var run=true;

var notify = 0;

var useAccel=true;


var ie=(navigator.appName == 'Microsoft Internet Explorer');

function init(){
	//	alert('loaded document!');	

	loadedThings++;
	if(loadedThings!=2)return true;


	textInput=document.getElementById('textInput');
	headDiv=document.getElementById('header');
	msgDiv=document.getElementById('messages');
	notDiv=document.getElementById('msgNote');
	
	container=(document.getElementById('container'));


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
}

function initSocket(){
	
	if(socket){
		socket.disconnect();
		socket=null;
	}
	
	//["websocket", "flashsocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"]
	//var transports=["websocket","flashsocket"];
	//var transports=["websocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"];
	var transports=["websocket", "htmlfile", "xhr-multipart", "xhr-polling", "jsonp-polling"];
	
	//if(WebSocket)var transports=["websocket"];
	
	//force opera to use flashsocket
//	if(io.util.opera) transports=["flashsocket"];
	
	socket = new io.Socket(socketHost,{'port':socketPort,'transports':transports,
	     'rememberTransport':false});

	socket.on('connect',handleConnect);
	socket.on('message',handleMessage);
	socket.on('disconnect',handleDisconnect);
	
	socket.sendJSON=function(data){
		if(socket.connected){
			this.send(JSON.stringify(data));
		}
	}
	
	socket.connect();
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
	if(!socket.connected){
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

window.ondeviceorientation=function(e){
	if(useAccel){
		gravityY=e.beta/90;
		gravityX=e.gamma/90;
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

function Ball(xi,yi,vxi,vyi,ri,color,type){
	
	this.x=xi;
	this.y=yi;
	this.vx=vxi;
	this.vy=vyi;
	
	this.type=type||'ball';
	
	this.color=color||ballColor;
	
	var zombieColor='rgb(67,67,67)';
	
	this.r=ri || defRad;
	
	this.density=.001;
	
	this.m=Math.PI*this.r*this.r*this.density;
	
	this.div=document.createElement('div');
	this.div.className='ball';
	container.appendChild(this.div);
	
	this.div.style.backgroundColor=this.color;
	
	this.removed=false;
	

	this.step=function(){
		
		//plague
		if(this.infected){
			this.setR(this.r-.5);
			if(this.r<4)this.remove();
		}
		
		//gravity
		this.vx+=gravityX;
		this.vy+=gravityY;
		
		this.vx*=1-friction;
		this.vy*=1-friction;
		
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
	
	this.send=function(edge){
		
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
	this.upLoc=function(){
//		this.div.style.top=this.y-this.r+'px';
//		this.div.style.left=this.x-this.r+'px';

		this.div.style.top=Math.round(this.y-this.r)+'px';
		this.div.style.left=Math.round(this.x-this.r)+'px';
	}
	
	this.setR=function(newR){
		this.r=newR;
		this.m=Math.PI*this.r*this.r*this.density;
		this.div.style.width=Math.round(this.r*2)+'px';
		this.div.style.height=Math.round(this.r*2)+'px';
	}
	
	this.remove=function(){
		if(!this.removed){
			this.removed=true;
			container.removeChild(this.div);
		}
	}
	
	
	balls.push(this);
	
	this.upLoc();
	this.setR(this.r);
	
	//this happens a lot too
	this.doCollide=function(p){
		
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
 
			//uncollide
			var dma = dm-p1.r-p2.r;//adjusted for radius
 
			p1.x+=(dma*dxu)/2;
			p1.y+=(dma*dyu)/2;
			
			p2.x-=(dma*dxu)/2;
			p2.y-=(dma*dyu)/2;
		}
 
	}
	
	this.infect=function(){
		this.type='plagued';
		this.infected=true;
		this.color=zombieColor;
		this.div.style.backgroundColor=this.color;
	}
	
	if(this.type=='plagued'){
		this.infect();	
	}

}

function step(){
				
	//collisions!
	
	if(run){
	
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
	
	
	this.state;
	
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

function keyDown(e){
	if (!e) var e = window.event;

	var dG=.025;

	//E=e;
	
	if(e.target.id != 'textInput' || e.which==27){

		var code;
		if (e.keyCode) code = e.keyCode;
		else if (e.which) code = e.which;	//lastEvent=e;
		
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
			case 38: //up
				gravityY-=dG;
				break;

			case 40: //down
				gravityY+=dG;
				break;
				
			case 39: //right
				gravityX+=dG;
				break;
				
			case 37: //left
				gravityX-=dG;
				break;
			 case 70: //f
				freeze();
				break;
			case 65: //a
				useAccel=!useAccel;
				break;
			 case 71: //g
				gravityX=0;
				gravityY=0;
				break;
			 case 191: // /
				toggleTabs();
				break;
			case 73: //i
				
				if(balls.length){
					balls[Math.round(Math.random()*(balls.length-1))].infect();
				}

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
