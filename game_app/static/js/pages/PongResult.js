import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { checkUID, clearFeedbacks } from "../utils.js";

function PongResult(context, id) {
    let div = document.createElement("div");
    div.innerHTML = NavBar("Result", context);
    div.innerHTML += Persistents(context);
    div.innerHTML += /*html*/`
        <div id="PongResult-content">
            <div class="PongResult-container container-blur" style="padding: 50px; margin-top: 100px;">
                <div class="PongResult-winner d-flex justify-content-center justify-content-around align-items-center">
                    <img src="/static/img/neon_crown.png" class="d-none d-md-block">
                    <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="d-none d-sm-block">
                    <a href="/profile/username" class="linear-wipe fs-1 fw-bold text-center">Player 2</a>
                    <span class="linear-wipe fs-4 text-start mt-2">12 pts</span>
                    <img src="/static/img/neon_crown.png" class="d-none d-md-block">
                </div>
                <div class="py-4">
                <div class="d-flex justify-content-center fs-5">Game #1234</div>
                   <div class="line"></div>
                </div>
                <div id="pongResult-item" class="py-4">
                    <div class="pongResult-Streak text-center">
                        <div class="pongResult-Streak d-flex justify-content-center">
                            <img src="/static/img/flame.png" class="">
                            <div class="circle"></div>
                            <span class="fw-bold fs-1">6</span>
                        </div>
                            <label class="pongResult-BestStreak fw-bold pt-4">Best Streak</label>
                    </div>
                    <div class="row py-4">
                        <div class="pongResult-Rebounds text-center col-6">
                            <span class="fs-3">66</span><br>
                            <label>Rebounds</label>
                        </div>
                        <div class="pongResult-Ball text-center col-6">
                            <span class="fs-3">6</span><br>
                            <label>Ball speed</label>
                        </div>
                    </div>
                </div>
                <div class="PongResult-ListPlayers overflow-auto px-5 d-flex justify-content-center">
                    <div class="PongResult-players flex-nowrap text-center d-flex">
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">9 pts</span>
                        </div>

                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">8 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">7 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">6 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">5 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">4 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">3 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">2 pts</span>
                        </div>
                        <div class="PongResult-player row justify-content-center">
                            <img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
                            <a href="/profile/username" class="fs-4 fw-semibold">username</a>
                            <span class="fs-5">1 pts</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
	`;
    return div.outerHTML;
}

export { PongResult };
