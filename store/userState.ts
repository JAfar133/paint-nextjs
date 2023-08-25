import {makeAutoObservable} from "mobx";

interface User {
    _id: number;
    username: string;
    email: string;
}
class UserState {
    _isAuth: boolean;
    _user: User | null;
    _loading: boolean = true;
    _color: string = "foreground"

    constructor() {
        this._isAuth = false;
        this._user = null;
        makeAutoObservable(this);
    }

    setIsAuth(isAuth: boolean){
        this._isAuth = isAuth;
    }
    setColor(color: string) {
        this._color = color;
    }
    setUser(user: User | null){
        this._user = user;
    }
    setLoading(loading: boolean){
        this._loading = loading;
    }

    get isAuth(){
        return this._isAuth;
    }
    get user(){
        return this._user;
    }
    get color(){
        return this._color;
    }

    get loading(){
        return this._loading;
    }

    logout(){
        this.setUser(null);
        this.setIsAuth(false);
        localStorage.removeItem('token');
    }
}

export default new UserState()