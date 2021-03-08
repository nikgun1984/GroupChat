/** Chat rooms that can be joined/left/broadcast to. */

// in-memory storage of roomNames -> room

const ROOMS = new Map();

/** Room is a collection of listening members; this becomes a "chat room"
 *   where individual users can join/leave/broadcast to.
 */

class Room {
	/** get room by that name, creating if nonexistent
	 *
	 * This uses a programming pattern often called a "registry" ---
	 * users of this class only need to .get to find a room; they don't
	 * need to know about the ROOMS variable that holds the rooms. To
	 * them, the Room class manages all of this stuff for them.
	 **/

	static get(roomName) {
		if (!ROOMS.has(roomName)) {
			ROOMS.set(roomName, new Room(roomName));
		}

		return ROOMS.get(roomName);
	}

	/** make a new room, starting with empty set of listeners */

	constructor(roomName) {
		this.name = roomName;
		this.members = new Set();
	}

	/** member joining a room. */

	join(member) {
		this.members.add(member);
	}

	/** member leaving a room. */

	leave(member) {
		this.members.delete(member);
	}

	/** send message to all members in a room. */

	broadcast(data) {
		console.log(this.members + "in broadcast");
		for (let member of this.members) {
			console.log(member);
			member.send(JSON.stringify(data));
		}
	}

	/* send a joke to the member requested it */

	sendJoke(name, data) {
		let member = Array.from(this.members).filter((user) => user.name === name);
		member[0].send(JSON.stringify(data));
	}

	/* print all members who are currently in the chat room to the member requested it */

	sendAllMembers(name, data) {
		let member = Array.from(this.members).filter((user) => user.name === name);
		const memNames = [];
		for (let member of this.members) {
			member.name === name ? memNames.push("you") : memNames.push(member.name);
		}
		data.text = "In room: ".concat(memNames.join(","));
		member[0].send(JSON.stringify(data));
	}

	/* send a private message to a certain member */

	sendToMember(data) {
		// extract necessary data
		let text = data.text.split(" ");

		const receiver = Array.from(this.members).filter(
			(user) => user.name === text[1]
		)[0];
		const sender = Array.from(this.members).filter(
			(user) => user.name === data.name
		)[0];

		if (receiver) {
			data.text = text.slice(2).join(" ");
			data.otherName = text[1];
			receiver.send(JSON.stringify(data));
			sender.send(JSON.stringify(data));
		} else {
			data.text = `Unfortunately either ${text[1]} left the room or not in the room at the moment`;
			data.name = "Server";
			sender.send(JSON.stringify(data));
		}
	}

	/* change userName */
	changeUserName(data) {
		// extract necessary data
		let newName = data.text.trim().split(" ")[1];
		const member = Array.from(this.members).filter(
			(user) => user.name === data.name
		)[0];
		let prevName = member.name;
		member.name = newName;
		if (member.name !== prevName) {
			data.text = `${prevName} changed name to ${newName}`;
		}
		for (let member of this.members) {
			console.log(member);
			member.send(JSON.stringify(data));
		}
	}
}

module.exports = Room;
