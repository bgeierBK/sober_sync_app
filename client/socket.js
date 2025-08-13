import { io } from "socket.io-client";

const socket = io("http://localhost:5550"); // Backend URL

export default socket;
