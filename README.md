# Installations
- Install [Node.js](https://nodejs.org/en/download/)
- Run `npm install`

## Generate links
- Go in Links folder and run `node index`

## Generate data from links
- Go in Data folder and run `node index`

# Configuration   
## Link generation
 - URL in "Link" must have "/" at the end
 - If nbPage equals 0, it will be considered as a infinite scroll page
 - The selector of items must target a `<a>` tag  
  
## Data generation
 - ID in data must be unique and without any special character
 - baseURL in img must not contain a "/" at the end
 - The selectof of img must target a `<img>` tag
