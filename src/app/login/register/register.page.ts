import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  
  validations_form: FormGroup;
  errorMessage = '';
  successMessage = '';

  validation_messages = {
    name: [
      {type: 'required', message: 'Name is required.'}
    ],
    email: [
      {type: 'required', message: 'Email is required.'},
      {type: 'pattern', message: 'Please enter a valid email.'}
    ],
    password: [
      {type: 'required', message: 'Password is required.'},
      {type: 'pattern', message: 'Password must be at least 6 characters long.'}
    ],
    confirm: [
      {type: 'required', message: 'Please retype password to confirm.'},
    ]
  };

  constructor(
      private authSrv: AuthService,
      private formBuilder: FormBuilder,
      private navCtrl: NavController,
      private toastController: ToastController
  ) { }

  ngOnInit() {
    this.validations_form = this.formBuilder.group({
      name: new FormControl('', Validators.compose([
        Validators.required,
        Validators.maxLength(20)
      ])),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[A-Za-z0-9._%+-]{3,}@[a-zA-Z]{3,}([.]{1}[a-zA-Z]{2,}|[.]{1}[a-zA-Z]{2,}[.]{1}[a-zA-Z]{2,})')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(6),
        Validators.required
      ])),
      confirm: new FormControl('', Validators.compose([
        Validators.required
      ]))
    }, {validator: this.matchingPasswords('password', 'confirm')});
  }

  matchingPasswords(passwordKey: string, confirmKey: string) {
    return (group: FormGroup): {[key: string]: any} => {
      const password = group.controls[passwordKey];
      const confirm = group.controls[confirmKey];

      if (password.value !== confirm.value) {
        return {
          mismatchedPasswords: true
        };
      }
    };
  }

  tryRegister(value){
    this.authSrv.registerUser(value)
        .then(res => {
          console.log(res);
          this.goToLogin();
          this.presentToast();
        }, err => {
          console.log(err);
          this.errorMessage = err.message;
          this.successMessage = '';
        });
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Your account has been successfully created.',
      color: 'primary',
      duration: 2500,
      position: 'bottom'
    });

    await toast.present();
  }
}
