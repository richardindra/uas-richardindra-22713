import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private fireDb: AngularFireDatabase
  ) { }

  getUserData(uid) {
    return this.fireDb.object('users/' + uid).valueChanges();
  }

  getUidFromEmail(email){
    return new Promise(resolve => {
      this.fireDb.list('users/').snapshotChanges().pipe(
        map(changes =>
          changes.map(c => ({key: c.payload.key, ...c.payload.val() as {}}))
        )
      ).subscribe(datas => {
        datas.forEach(data => {
          if(data['email'] == email) resolve(data['key'])
        });
        resolve("");
      })
    });
  }

  getUserFriend(uid) {
    return new Promise(resolve => {
      this.getUserData(uid).subscribe( data => {
        if(data['friends'] !== undefined && data['friends'] !== null && data['friends'] !== "")
          resolve(data['friends'].split(","));
        else
          resolve([]);
      })
    })
  }

  async updateFriendList(uidUser, uidFriend, action){
    var friends;
    friends = await this.getUserFriend(uidUser);
      
    if(action == "add") friends.push(uidFriend);
    if(action == "remove") friends.splice(friends.indexOf(uidFriend), 1);

    friends = friends.join(",");
    
    this.fireDb.object('users/' + uidUser).update({
      friends: friends
    });
  }

  getUserCheckIn(uid) {
    return new Promise(resolve => {
      this.getUserData(uid).subscribe( data => {
        if(data['checkin'] !== undefined && data['checkin'] !== null && data['checkin'] !== ""){
          var checkinsraw = data['checkin'].split("|||");
          var checkins = [];
          checkinsraw.forEach(checkin => {
            checkins.push(checkin.split("||"));
          })
          resolve(checkins);
        }
        else resolve([]);
      })
    })
  }

  setUserLocation(uid, loc, time){
    var locStr = loc['lat'] + "," + loc['lng'];
    this.fireDb.object('users/' + uid).update({
      lastLoc: locStr,
      lastTime: time
    });
  }

  async updateCheckinList(uid, locname, time, action){
    var checkins;
    checkins = await this.getUserCheckIn(uid);

    var newCheckin = [locname, time];
    if(action == "add") checkins.push(newCheckin);
    if(action == "remove") checkins.splice(locname, 1);
    
    var newCheckins = [];
    checkins.forEach((checkin: String[]) => {
      newCheckins.push(checkin.join("||"));
    })
    this.fireDb.object('users/' + uid).update({
      checkin: newCheckins.join("|||")
    });
  }
}
