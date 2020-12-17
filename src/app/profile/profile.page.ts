import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  userUid: any;
  username: any = "...";
  userCheckins: any = [];

  constructor(
    private fireAuth: AngularFireAuth,
    private userService: UserService,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.getUserUid();
    this.getUserName();
    this.getUserCheckins();
  }

  ionViewDidEnter() {
    if(this.userUid != null){    
      this.getUserCheckins();
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

  getUserName(){
    this.userService.getUserData(this.userUid).subscribe( data => {
      this.username = data['name'];
    });
  }

  async getUserCheckins() {
    this.userCheckins = await this.userService.getUserCheckIn(this.userUid);

    this.userCheckins.forEach(checkin => {
      if(checkin[0] !== "auto checked") checkin[0] = "checked at " + checkin[0];
      checkin[1] = new Date(parseInt(checkin[1]));
    })
  }

  async removeCheckin(index){
    await this.userService.updateCheckinList(this.userUid, index, 0, "remove");
    this.presentToast("Check in removed.","success");
    this.getUserCheckins();
  }

  logout() {
    this.authService.logoutUser();
  }

  async presentToast(message, color) {
    const toast = await this.toastController.create({
      message: message,
      color: color,
      duration: 2500,
    });
    toast.present();
  }

}
