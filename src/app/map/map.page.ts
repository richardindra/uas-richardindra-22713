import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';
import { UserService } from '../services/user.service';

declare var google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {

  map: any;
  markers: any;
  userLoc: any;
  isCheckIn: boolean = false;
  locName: string;
  @ViewChild('map', {read: ElementRef, static: false}) mapRef: ElementRef;
  
  userUid: string;

  constructor(
    private fireAuth: AngularFireAuth,
    private userService: UserService,
    private toastController: ToastController,
  ) { }

  async ngOnInit() {
    await this.getUserUid();
    await this.getCurrentLocation();
    this.autoUpdatePos();
    this.showMap();
    this.getFriendMarkers();
  }

  ionViewDidEnter(){
    if(this.userLoc != null){
      this.showMap();
      this.getFriendMarkers();
    }
  }

  getUserUid() {
    return new Promise(resolve => {
      this.fireAuth.authState.subscribe( authState => {
        this.userUid = authState.uid;
        resolve();
      })
    })
  }

  showMap() {
    const options = {
      center: new google.maps.LatLng(this.userLoc.lat, this.userLoc.lng),
      zoom: 15,
      disableDefaultUI: true
    };
    this.map = new google.maps.Map(this.mapRef.nativeElement, options);
    
    const marker = new google.maps.Marker({
      position: this.userLoc,
      map: this.map
    });
  }

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position: Position) => {
              this.userLoc = {lat: position.coords.latitude, lng: position.coords.longitude};
              resolve();
          },
          (err) => {
            reject(err);  
          }
        );
      }
    });
  }
  
  async getFriendMarkers(){
    var friends = await this.userService.getUserFriend(this.userUid) as [];

    friends.forEach(uid => {
      this.userService.getUserData(uid).subscribe(data => {
        var latlng = [];
        if(data['lastLoc'] != null){
          latlng = data['lastLoc'].split(",");
          latlng[0] = parseFloat(latlng[0]);
          latlng[1] = parseFloat(latlng[1]);
        }else{
          latlng = [0,0];
        }
        console.log(latlng);
        const marker = new google.maps.Marker({
          position: {lat: latlng[0], lng: latlng[1]},
          map: this.map
        });
      });
    });
  }

  async autoUpdatePos() {
    var lastUpdate = await this.getUserLastUpdate() as number;
    var currentTime = new Date().getTime()
    if(currentTime - lastUpdate > 600000){
      this.userService.setUserLocation(this.userUid, this.userLoc, currentTime);
      this.userService.updateCheckinList(this.userUid, "auto checked", currentTime, "add");
      this.presentToast("You're automatically checked in.","success");
    }
  }

  addCheckin() {
    var currentTime = new Date().getTime()
    this.userService.setUserLocation(this.userUid ,this.userLoc, currentTime);
    this.userService.updateCheckinList(this.userUid, this.locName, currentTime, "add");
    this.presentToast("Check in added.","success");
    this.locName = "";
    this.toggleCheckIn();
  }

  getUserLastUpdate() {
    return new Promise((resolve, reject) => {
      this.userService.getUserData(this.userUid).subscribe(data => {
        if(data['lastTime'] != null) resolve(parseInt(data['lastTime']));
        resolve(0);
      });
    });
  }

  toggleCheckIn(){
    this.isCheckIn = !this.isCheckIn;
  }

  centerMap() {
    this.map.setCenter(this.userLoc);
  }

  async presentToast(message, color) {
    const toast = await this.toastController.create({
      message: message,
      color: color,
      duration: 1000,
    });
    toast.present();
  }

}