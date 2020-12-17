import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-friend',
  templateUrl: './friend.page.html',
  styleUrls: ['./friend.page.scss'],
})
export class FriendPage implements OnInit {

  email: string = "";
  search: string = ""
  userUid: string;
  userFriends: any = [];

  constructor(
    private fireAuth: AngularFireAuth,
    private userService: UserService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    await this.getUserUid();
    this.getFriends();
  }

  getUserUid() {
    return new Promise(resolve => {
      this.fireAuth.authState.subscribe( authState => {
        this.userUid = authState.uid;
        resolve();
      })
    })
  }

  async getFriends(){
    var friends = await this.userService.getUserFriend(this.userUid) as [];

    this.userFriends = [];
    friends.forEach(uid => {
      this.userService.getUserData(uid).subscribe(data => {
        this.userFriends.push({
          name: data['name'],
          email: data['email'],
        });
      });
    });
  }

  emailFriendExist(email){
    var ret = false;
    this.userFriends.forEach(userFriend => {
      if(userFriend['email'] == email) ret = true;
    })
    return ret;
  }

  async addFriend() {
    var uid = await this.userService.getUidFromEmail(this.email);
    console.log(this.emailFriendExist(this.email));
    if(uid == ""){
      this.presentToast("This account does not exist.", "warning");
    }else if(uid == this.userUid){
      this.presentToast("You can't add yourself.", "warning");
    }else if(this.emailFriendExist(this.email)){
      this.presentToast("This friend is already added.", "warning");
    }else{
      await this.userService.updateFriendList(this.userUid, uid, "add");
      this.presentToast("Friend added.", "success");
    }
    this.getFriends();
  }

  async removeFriend(email) {
    var uid = await this.userService.getUidFromEmail(email);
    await this.userService.updateFriendList(this.userUid, uid, "remove");
    this.presentToast("Friend removed.", "success");
    this.getFriends();
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
