import "./LandingPage.css";
import InterfaceImage from "../assets/Trail.webp";
import Video1 from "../assets/Video1.mp4";
import Video2 from "../assets/Video2.mp4";
import firstGIF from "../assets/FirstGIF.gif";
import coolEffect1 from "../assets/Image1.webp";
import coolEffect2 from "../assets/Image2.webp";
import blank from "../assets/blank.webp";

function LandingPage(){
    return <div className="LandingPage">
        <div id="NavBar">
            <div className="Title">
                <img src="" alt="" />
                <h2>Swish</h2>
            </div>
            <nav>
                <button>Join</button>
            </nav>
        </div>
        <div className="MainLandingPage">
            <section className="firstSection">
                <img src={InterfaceImage} alt="Interface" />
                <div className="One">
                    <h2>Group chat that’s all fun & engaging</h2>
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Laborum dignissimos vitae at. Nesciunt quibusdam voluptatem distinctio sint doloribus officiis dicta?</p>
                </div>
            </section>
            <section className="secondSection">
                <div className="box">
                    <img src={firstGIF} alt="GIF" />
                    <div className="part">
                        <h3>MAKE YOUR GROUP CHATS MORE FUN</h3>
                        <p>Use custom emoji, stickers, soundboard effects and more to add your personality to your voice, video, or text chat. Set your avatar and a custom status, and write your own profile to show up in chat your way.</p>
                    </div>
                    <div className="innerbox">
                        <video autoPlay muted loop>
                            <source src={Video1}/>
                        </video>
                    </div>
                </div>
            </section>
            <section className="thirdSection">
                <div className="box">
                    <div className="CoolEffect">
                        <img src={coolEffect1} alt="Image1" />
                        <img src={coolEffect2} alt="Image2" />
                        <img src={blank} alt="blank" />
                    </div>
                    <div className="part">
                    <h3>stream like you’re in the same room</h3>
                    <p>High quality and low latency streaming makes it feel like you're hanging out on the couch with friends while playing a game, watching shows, looking at photos, or idk doing homework or something.</p>
                    </div>
                    <div className="innerbox">
                        <video autoPlay muted loop>
                            <source src={Video2}/>
                        </video>
                    </div>
                </div>
            </section>
            {/* <section className="secondSection"></section>
            <section className="secondSection"></section>
            <section className="secondSection"></section>
            <section className="secondSection"></section> */}
        </div>
        
    </div>
}

export default LandingPage;