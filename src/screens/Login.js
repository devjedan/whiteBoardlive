import React, { Component } from "react";
import { Container, Row, Col, Button, Input } from 'reactstrap';
import Pusher from "pusher-js";
import axios from "axios";
import stringHash from "string-hash";

import uniquename from "../helpers/uniquename";

const channel_name = uniquename();

const PUSHER_APP_KEY = process.env.REACT_APP_PUSHER_APP_KEY;
const PUSHER_APP_CLUSTER = process.env.REACT_APP_PUSHER_APP_CLUSTER;
const BASE_URL = "http://localhost:5000";

class LoginScreen extends Component {

  state = {
    myUsername: "",
    channelName: channel_name,
    isLoading: false
  }

  constructor(props) {
    super(props);
    this.pusher = null;
    this.group_channel = null;
  }

	render() {
    return (
      <Container>
        <Row>
          <Col lg={12}>
            <div className="centered">
              <div className="textInputContainer">
                <Input 
                  type="text"
                  placeholder="myUsername"
                  onChange={this.onUpdateText}
                  value={this.state.myUsername} />
              </div>

              <div className="textInputContainer">
                <Input 
                  type="text"
                  placeholder="channelName"
                  onChange={this.onUpdateText}
                  value={this.state.channelName} />
              </div>

              <div className="buttonContainer">
                <Button 
                  type="button" 
                  color="primary" 
                  onClick={this.login} 
                  disabled={this.state.isLoading} 
                  block>
                    {this.state.isLoading ? "Logging in…" : "Login"}
                </Button>
              </div>

            </div>
          </Col>
        </Row>
      </Container>
    );
	}


  onUpdateText = (evt) => {
    const field = evt.target.getAttribute("placeholder");
    this.setState({
      [field]: evt.target.value
    });
  };


  login = () => {
    const { myUsername, channelName } = this.state;
    const myUserID = stringHash(myUsername).toString();

    this.setState({
      isLoading: true
    });

    this.pusher = new Pusher(PUSHER_APP_KEY, {
      authEndpoint: `${BASE_URL}/pusher/auth`,
      cluster: PUSHER_APP_CLUSTER,
      encrypted: true
    });

    this.group_channel = this.pusher.subscribe(`private-group-${channelName}`);
    this.group_channel.bind("pusher:subscription_error", (status) => {
      console.log("error subscribing to group channel: ", status);
    });

    this.group_channel.bind("pusher:subscription_succeeded", async () => {
      console.log("subscription to group succeeded");
      
      try {
        const response = await axios.post(`${BASE_URL}/login`, {
          user_id: myUserID,
          username: myUsername,
          channel: channelName
        });

        if (response.status === 200) {
          this.props.navigation.navigate("Whiteboard", {
            roomID: response.data.room_id,
            channelName,
            myUserID,
            myUsername,
            pusher: this.pusher,
            group_channel: this.group_channel
          });
        }
      } catch (e) {
        console.log("error occured logging in: ", e);
      }
    
    });

  }  

}

export default LoginScreen;