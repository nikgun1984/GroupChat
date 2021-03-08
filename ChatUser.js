/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");
const axios = require("axios");

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
	/** make chat: store connection-device, rooom */

	constructor(send, roomName) {
		this._send = send; // "send" function for this user
		this.room = Room.get(roomName); // room user will be in
		this.name = null; // becomes the username of the visitor

		console.log(`created chat in ${this.room.name}`);
	}

	toString() {
		return `{Name: ${this.name},Room: ${this.room}`;
	}

	set newName(name) {
		if (name) {
			this.name = name;
		}
	}

	/** send msgs to this client using underlying connection-send-function */

	send(data) {
		try {
			this._send(data);
		} catch {
			// If trying to send to a user fails, ignore it
		}
	}

	/** handle joining: add to room members, announce join */

	handleJoin(name) {
		this.name = name;
		this.room.join(this);
		this.room.broadcast({
			type: "note",
			text: `${this.name} joined "${this.room.name}".`,
		});
	}

	/** handle a chat: broadcast to room. */

	handleChat(text) {
		this.room.broadcast({
			name: this.name,
			type: "chat",
			text: text,
		});
	}

	/* handle a joke: send a joke to only the one who requested the joke */

	async handleJoke() {
		this.room.sendJoke(this.name, {
			name: "Server",
			type: "chat",
			text: await this.getJoke(),
		});
	}

	/* handle who is currently in the group with you */

	handleLookUpMembers() {
		this.room.sendAllMembers(this.name, {
			name: "Server",
			type: "chat",
			text: [],
		});
	}

	handlePrivateMessage(text) {
		this.room.sendToMember({
			name: this.name,
			type: "chat",
			text: text,
		});
	}

	handleChangeName(text) {
		this.room.changeUserName({
			name: this.name,
			type: "chat",
			text: text,
		});
	}

	/** Handle messages from client:
	 *
	 * - {type: "join", name: username} : join
	 * - {type: "chat", text: msg }     : chat
	 *
	 */

	handleMessage(jsonData) {
		let msg = JSON.parse(jsonData);
		if (msg.type === "join") {
			this.handleJoin(msg.name);
		} else if (msg.type === "chat") {
			let message = msg.text;
			if (message.startsWith("/priv")) {
				message = "/priv";
			}
			if (message.startsWith("/name")) {
				message = "/name";
			}
			switch (message) {
				case "/joke":
					this.handleJoke();
					break;
				case "/members":
					this.handleLookUpMembers();
					break;
				case "/priv":
					this.handlePrivateMessage(msg.text);
					break;
				case "/name":
					this.handleChangeName(msg.text);
					break;
				default:
					this.handleChat(msg.text);
			}
		} else {
			throw new Error(`bad message: ${msg.type}`);
		}
	}

	/** Connection was closed: leave room, announce exit to others */

	handleClose() {
		this.room.leave(this);
		this.room.broadcast({
			type: "note",
			text: `${this.name} left ${this.room.name}.`,
		});
	}

	/* get a joke from API */

	async getJoke() {
		const res = await axios.get("https://icanhazdadjoke.com/", {
			headers: { Accept: "text/plain" },
		});
		return res.data;
	}
}

module.exports = ChatUser;
