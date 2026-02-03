
# EmbyReviews

A TMDB Review section for Emby Media Server


### First and foremost:
- This is vibe-coded with the help of Claude Opus 4.5 and just a proof of concept
- Tested with stable Server 4.9.X.X on a 1080p-Screen
- This Banner just works on the Web Client
- Big thanks to @Druidblack for the ratings codebase (https://github.com/Druidblack/jellyfin_ratings)


## Installation

 1. Download [Reviews.js](https://github.com/v1rusnl/EmbyReviews/blob/main/Reviews.js)
 
 2. Set up your TMDB_API_KEY in line 13 -> The key is needed to retrieve Reviews
 
 3. Change the following values (line 16-24) to your needs:

 4. Paste modified Reviews.js inside /system/dashboard-ui/ (Windows) or your OS equivalent
 
 5. Add ```<script src="Reviews.js"></script>``` before ```</body>``` tag at the end of /system/dashboard-ui/index.html
 
 6. Clear Cache and hard reload Emby Web

## License

[MIT](https://github.com/v1rusnl/EmbyReviews/blob/main/LICENSE)
