import React, { useEffect, useState } from "react";

import StepByStep from "./StepByStep/StepByStep";
import "./styles.css";
const PAGE_ID = "103514118533493";
function App() {
  const [postCaption, setPostCaption] = useState(decodeURI(getQueryVariable('post_caption')));
  const [imgUrl] = useState(getQueryVariable('post_url'));
  const [isSharingPost, setIsSharingPost] = useState(false);
  const [facebookUserAccessToken, setFacebookUserAccessToken] = useState("");
  const [fbPageAccessToken, setFbPageAccessToken] = React.useState();
  const [isPublishing, setIsPublishing] = React.useState(false);
  /* --------------------------------------------------------
   *                      FACEBOOK LOGIN
   * --------------------------------------------------------
   */

  // Check if the user is authenticated with Facebook
  useEffect(() => {
    window.FB.getLoginStatus((response) => {
      setFacebookUserAccessToken(response.authResponse?.accessToken);
    });
  }, []);

  const logInToFB = () => {
    window.FB.login(
      (response) => {
        setFacebookUserAccessToken(response.authResponse?.accessToken);
      },
      {
        // Scopes that allow us to publish content to Instagram
        scope: "instagram_basic,pages_show_list",
      }
    );
  };

  const logOutOfFB = () => {
    window.FB.logout(() => {
      setFacebookUserAccessToken(undefined);
    });
  };

  /* --------------------------------------------------------
   *             INSTAGRAM AND FACEBOOK GRAPH APIs
   * --------------------------------------------------------
   */

  const getFacebookPages = () => {
    return new Promise((resolve) => {
      window.FB.api(
        "me/accounts",
        { access_token: facebookUserAccessToken },
        (response) => {
          resolve(response.data);
        }
      );
    });
  };
  React.useEffect(() => {
    if (facebookUserAccessToken) {
      window.FB.api(
        `/${PAGE_ID}?fields=access_token&access_token=${facebookUserAccessToken}`,
        ({ access_token }) => setFbPageAccessToken(access_token)
      );
    }
  }, [facebookUserAccessToken]);


  const getInstagramAccountId = (facebookPageId) => {
    return new Promise((resolve) => {
      window.FB.api(
        facebookPageId,
        {
          access_token: facebookUserAccessToken,
          fields: "instagram_business_account",
        },
        (response) => {
          resolve(response.instagram_business_account.id);
        }
      );
    });
  };

  const createMediaObjectContainer = (instagramAccountId) => {
    return new Promise((resolve) => {
      window.FB.api(
        `${instagramAccountId}/media`,
        "POST",
        {
          access_token: facebookUserAccessToken,
          image_url: imgUrl,
          caption: postCaption,
        },
        (response) => {
          resolve(response.id);
        }
      );
    });
  };
  // Publishes a post on the Facebook page
  const sendPostToPage = React.useCallback(() => {
    setIsPublishing(true);
    window.FB.api(
      `/${PAGE_ID}/photos`,
      "POST",
      {
        message: postCaption,
        url:imgUrl,
        access_token: fbPageAccessToken,
      },
      () => {
        setIsPublishing(false);
        console.log(postCaption);
      }
    );
  }, [postCaption,imgUrl,fbPageAccessToken]);

  const publishMediaObjectContainer = (
    instagramAccountId,
    mediaObjectContainerId
  ) => {
    return new Promise((resolve) => {
      window.FB.api(
        `${instagramAccountId}/media_publish`,
        "POST",
        {
          access_token: facebookUserAccessToken,
          creation_id: mediaObjectContainerId,
        },
        (response) => {
          resolve(response.id);
        }
      );
    });
  };
  function getQueryVariable(variable)
  {
          var query = window.location.search.substring(1);
          var vars = query.split("&");
          for (var i=0;i<vars.length;i++) {
                      var pair = vars[i].split("=");
          if(pair[0] === variable){return pair[1];}
           }
           return(false);
  }
  const shareInstagramPost = async () => {
    setIsSharingPost(true);
    const facebookPages = await getFacebookPages();
    const instagramAccountId = await getInstagramAccountId(facebookPages[0].id);
    const mediaObjectContainerId = await createMediaObjectContainer(
      instagramAccountId
    );

    await publishMediaObjectContainer(
      instagramAccountId,
      mediaObjectContainerId
    );

    setIsSharingPost(false);
    setPostCaption("");
  };

  return (
    <>
      <main id="app-main">
        <section className="app-section">
        {facebookUserAccessToken ? (
             <p></p>
          ) : (
            <p>Login to your facebook account to share your posts.</p>
          )}
          {facebookUserAccessToken ? (
            <button onClick={logOutOfFB} className="btn action-btn fb-btn">
              Log out of Facebook
            </button>
          ) : (
            <button onClick={logInToFB} className="btn action-btn fb-btn">
              Login with Facebook
            </button>
          )}
        </section>
        {facebookUserAccessToken ? (
          <section className="app-section">
            <div className="row">
            <div className="pullLeft">
            <img src={imgUrl} width="100%" alt="social media post"/>
            </div>
            <div className="pullRight">
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="Write a caption..."
              rows="22"
            />
            <button
              onClick={shareInstagramPost}
              className="btn action-btn insta-btn"
            >
              {isSharingPost ? "Sharing..." : "Share on Instagram"}
            </button>
            {fbPageAccessToken ? (
            <button
              onClick={sendPostToPage}
              className="btn action-btn"
            >
              {isPublishing ? "Posting..." : "Post on fb Page"}
            </button>
            ) : null}
            </div>
            </div>
          </section>
        ) : null}
       
      </main>
      <StepByStep facebookUserAccessToken={facebookUserAccessToken} />
    </>
  );
}

export default App;
