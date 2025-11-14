import React from 'react';

// NOTE: You must move the icon images you uploaded 
// into your /src/assets/ folder for these paths to work.
import followIcon from '../../assets/eye.png'; // The 'open eye'
import unfollowIcon from '../../assets/hidden.png'; // The 'slashed eye'

const FollowIcon = ({ isFollowing }) => {
  return (
    <img
      src={isFollowing ? unfollowIcon : followIcon}
      alt={isFollowing ? 'Unfollow user' : 'Follow user'}
      className="w-5 h-5"
    />
  );
};

export default FollowIcon;