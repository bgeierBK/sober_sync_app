import App from "./pages/App";
import Error from "./pages/Error";
import EventPage from "./pages/EventPage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import UserProfile from "./pages/UserProfile";
import Home from "./pages/Home";
import TheLounge from "./pages/TheLounge";
import About from "./pages/About";

const routes = [
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/users/:id",
        element: <UserProfile />,
        errorElement: <Error />,
      },
      {
        path: "/events/:id",
        element: <EventPage />,
        errorElement: <Error />,
      },
      {
        path: "/login",
        element: <LogInPage />,
        errorElement: <Error />,
      },
      {
        path: "/signup",
        element: <SignUpPage />,
        errorElement: <Error />,
      },
      {
        path: "/thelounge",
        element: <TheLounge />,
        errorElement: <Error />,
      },
      {
        path: "/about",
        element: <About />,
        errorElement: <Error />,
      },
    ],
  },
];

export default routes;
