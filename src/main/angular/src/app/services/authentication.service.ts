import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

import { User } from '../classes/user';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";

@Injectable()
export class AuthenticationService {

  private urlLogIn = '/api-logIn';
  private urlLogOut = '/api-logOut';

  public token: string;
  private user: User;
  private role: string;

  constructor(private http: HttpClient, private router: Router) {
    //this.reqIsLogged().catch((e) => { });
  }

  logIn(user: string, pass: string) {
    let userPass = user + ":" + pass;
    const options = {
      headers: new HttpHeaders({
        'Authorization': 'Basic ' + utf8_to_b64(userPass),
        'X-Requested-With': 'XMLHttpRequest'
      })
    };

    return this.http.get<User>(this.urlLogIn, options);
  }

  logOut() {

    console.log("Logging out...");

    return this.http.get<User>(this.urlLogOut).pipe(
      response => {

        console.log("Logout succesful!");

        this.user = null;
        this.role = null;

        // clear token remove user from local storage to log user out and navigates to welcome page
        this.token = null;
        localStorage.removeItem('login');
        localStorage.removeItem('rol');
        this.router.navigate(['']);

        return response;
      })
  }

  private processLogInResponse(response) {
    
    // Correctly logged in
    console.log("User is already logged");

    this.user = (response.json() as User);

    localStorage.setItem("login", "FULLTEACHING");
    if (this.user.roles.indexOf("ROLE_ADMIN") !== -1) {
      this.role = "ROLE_ADMIN";
      localStorage.setItem("rol", "ROLE_ADMIN");
    }
    if (this.user.roles.indexOf("ROLE_TEACHER") !== -1) {
      this.role = "ROLE_TEACHER";
      localStorage.setItem("rol", "ROLE_TEACHER");
    }
    if (this.user.roles.indexOf("ROLE_STUDENT") !== -1) {
      this.role = "ROLE_STUDENT";
      localStorage.setItem("rol", "ROLE_STUDENT");
    }
  }

  reqIsLogged(): Promise<any> {

    return new Promise((resolve, reject) => {

      console.log("Checking if user is logged");
      const options = {
        headers: new HttpHeaders({
          'X-Requested-With': 'XMLHttpRequest'
        })
      };

      this.http.get(this.urlLogIn, options).subscribe(
        response => { this.processLogInResponse(response); resolve() },
        error => {
          let msg = '';
          if (error.status != 401) {
            msg = "Error when asking if logged: " + JSON.stringify(error);
            console.error(msg);
            this.logOut();
          } else {
            msg = "User is not logged in";
            console.warn(msg);
            this.router.navigate(['']);
          }
          reject(msg);
        }
      );
    });
  }

  checkCredentials(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isLoggedIn()) {
        this.reqIsLogged()
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        resolve();
      }
    });
  }

  isLoggedIn() {
    return (!!this.user);
  }

  getCurrentUser() {
    return this.user;
  }

  isTeacher() {
    return ((this.user.roles.indexOf("ROLE_TEACHER")) !== -1) && (localStorage.getItem('rol') === "ROLE_TEACHER");
  }

  isStudent() {
    return ((this.user.roles.indexOf("ROLE_STUDENT")) !== -1) && (localStorage.getItem('rol') === "ROLE_STUDENT");
  }

  isAdmin() {
    return ((this.user.roles.indexOf("ROLE_ADMIN")) !== -1) && (localStorage.getItem('rol') === "ROLE_ADMIN");
  }
}

function utf8_to_b64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode(<any>'0x' + p1);
  }));
}
