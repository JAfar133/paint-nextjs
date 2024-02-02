import {makeAutoObservable} from "mobx";

interface User {
    _id: number;
    username: string;
    email: string;
    role: string;
}
class UserState {
    _isAuth: boolean;
    _user: User | null;
    _loading: boolean = true;
    _color: string = "foreground"
    canPlayVideo = false;
    canPauseVideo = true;
    unreadMessages = 0;
    isChatOpen = false;
    fakeRole = 'user';
    constructor() {
        this._isAuth = false;
        this._user = null;
        makeAutoObservable(this);
    }
    isAdmin(){
        return this.user?.role === 'admin' || this.fakeRole === 'admin'
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

    setRole(role: string) {
        this.fakeRole = role
    }
    setLoading(loading: boolean){
        this._loading = loading;
    }
    setIsChatOpen(isOpen: boolean) {
        this.isChatOpen = isOpen
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
    get randomUser(): User{
        return {
            _id: (+new Date()),
            username: `Гость${(+new Date).toString(16)}`,
            email: `email${(+new Date).toString(16)}`,
            role: 'user'
        }
    }

    logout(){
        this.setUser(this.randomUser);
        this.setIsAuth(false);
        localStorage.removeItem('token');
    }
}

export default new UserState()