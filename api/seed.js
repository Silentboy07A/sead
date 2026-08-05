require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { connectToDatabase } = require('./_lib/utils/db');
const { initDatabase } = require('./_lib/utils/init-db');

const TMDB_BASE = 'https://image.tmdb.org/t/p/w500';

const MOVIES_SEED = [
  {
    _id: 1, title: 'Sinners', year: 2025, genre: 'Thriller', language: 'English', rating: 8.7, duration: '2h 17m', description: 'Twin brothers return to their hometown, only to discover a greater evil waiting.', poster: `${TMDB_BASE}/qTvFWCGeGXgBRaINLY1zqgTPSpn.jpg`, trailerId: 'bKGxHflevuk',
  },
  {
    _id: 2, title: 'Interstellar', year: 2014, genre: 'Sci-Fi', language: 'English', rating: 8.7, duration: '2h 49m', description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", poster: `${TMDB_BASE}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg`, trailerId: '0vxOhd4qlnA',
  },
  {
    _id: 3, title: 'The Dark Knight', year: 2008, genre: 'Action', language: 'English', rating: 9.0, duration: '2h 32m', description: 'When the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests.', poster: `${TMDB_BASE}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`, trailerId: 'EXeTwQWrcwY',
  },
  {
    _id: 4, title: 'Inception', year: 2010, genre: 'Sci-Fi', language: 'English', rating: 8.8, duration: '2h 28m', description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', poster: `${TMDB_BASE}/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg`, trailerId: 'YoHD9XEInc0',
  },
  {
    _id: 5, title: 'Oppenheimer', year: 2023, genre: 'Biography', language: 'English', rating: 8.4, duration: '3h 00m', description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster: `${TMDB_BASE}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`, trailerId: 'uYPbbksJxIg',
  },
  {
    _id: 6, title: 'Avengers: Endgame', year: 2019, genre: 'Action', language: 'English', rating: 8.4, duration: '3h 01m', description: 'After Infinity War, the Avengers assemble once more to restore balance to the universe.', poster: `${TMDB_BASE}/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg`, trailerId: 'TcMBFSGVi1c',
  },
  {
    _id: 7, title: 'Pushpa 2: The Rule', year: 2024, genre: 'Action', language: 'Hindi', rating: 7.5, duration: '3h 20m', description: 'Pushpa Raj returns as the king of the red sandalwood syndicate.', poster: `${TMDB_BASE}/t5ePZYRibJ0EEK1FK3GhihVkDW5.jpg`, trailerId: '1kVK0MZlbI4',
  },
  {
    _id: 8, title: 'Animal', year: 2023, genre: 'Action', language: 'Hindi', rating: 6.3, duration: '3h 21m', description: "A son's obsessive love for his father spirals into dark territory.", poster: `${TMDB_BASE}/hr9rjR3J0xBBKmlJ4n3gHId9ccx.jpg`, trailerId: '8FkLRUJj-o0',
  },
  {
    _id: 9, title: 'Stree 2', year: 2024, genre: 'Comedy Horror', language: 'Hindi', rating: 8.1, duration: '2h 29m', description: 'The town of Chanderi is haunted again. This time by a headless entity.', poster: `${TMDB_BASE}/2NC7sj8rheKxWqLYAbHnCa4mYBH.jpg`, trailerId: 'KVnheXywIbY',
  },
  {
    _id: 10, title: 'Pathaan', year: 2023, genre: 'Action', language: 'Hindi', rating: 5.9, duration: '2h 26m', description: 'An Indian spy takes on the leader of a group of mercenaries with nefarious plans.', poster: `${TMDB_BASE}/arf00BkwvXo0CFKbaD9OpqdE4Nu.jpg`, trailerId: 'vqu4z34wENw',
  },
  {
    _id: 11, title: 'Vidaamuyarchi', year: 2025, genre: 'Action', language: 'Tamil', rating: 8.4, duration: '2h 40m', description: 'Ajith Kumar stars in this high-octane action thriller set in Dubai.', poster: `${TMDB_BASE}/8We3MmAVkQxHxzCgfNurkp80qXd.jpg`, trailerId: 'hsoGpoDxyKg',
  },
  {
    _id: 12, title: 'Jailer', year: 2023, genre: 'Action', language: 'Tamil', rating: 7.1, duration: '2h 48m', description: "A retired jailer goes on a manhunt to find his son's killers.", poster: `${TMDB_BASE}/pTmMxAHqX4vsIDE6HPPxOR0Q6TN.jpg`, trailerId: 'Y5BeWdODPqo',
  },
  {
    _id: 13, title: 'Leo', year: 2023, genre: 'Action', language: 'Tamil', rating: 7.2, duration: '2h 44m', description: 'A mild-mannered cafe owner becomes a local hero, but old secrets catch up with him.', poster: `${TMDB_BASE}/t1oAdt8JjUs4sHEBvE8fKtjV7er.jpg`, trailerId: 'Po3jStA673E',
  },
  {
    _id: 14, title: 'Vikram', year: 2022, genre: 'Action', language: 'Tamil', rating: 8.3, duration: '2h 55m', description: 'A special agent investigates a murder committed by a masked group of serial killers.', poster: `${TMDB_BASE}/774UV1aCURb4s4JfEFg3IEMu5Zj.jpg`, trailerId: 'OKBMCL-frPU',
  },
  {
    _id: 15, title: 'RRR', year: 2022, genre: 'Action', language: 'Telugu', rating: 7.8, duration: '3h 7m', description: 'A fictitious story about two legendary revolutionaries and their journey away from home.', poster: `${TMDB_BASE}/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg`, trailerId: 'f_vbAtFSEc0',
  },
  {
    _id: 16, title: 'Kalki 2898 AD', year: 2024, genre: 'Sci-Fi', language: 'Telugu', rating: 7.6, duration: '3h 01m', description: 'In a post-apocalyptic world, a new avatar rises to protect the world from evil forces.', poster: `${TMDB_BASE}/4P3K5medethmTlsuN7UN5bmnATq.jpg`, trailerId: 'y1-w1kUGuz8',
  },
  {
    _id: 17, title: 'Salaar: Part 1 - Ceasefire', year: 2023, genre: 'Action', language: 'Telugu', rating: 6.5, duration: '2h 55m', description: 'A gang leader makes a promise to a dying friend and takes on other criminal gangs.', poster: `${TMDB_BASE}/nlu9WbcetNFRGXXPWITr30ob7W6.jpg`, trailerId: 'HihakYi5M2I',
  },
  {
    _id: 18, title: 'Manjummel Boys', year: 2024, genre: 'Survival Thriller', language: 'Malayalam', rating: 8.6, duration: '2h 15m', description: 'A daring rescue mission to save a friend from Guna Caves.', poster: `${TMDB_BASE}/bswrtewwthpsh6nABiqKevU4UBI.jpg`, trailerId: 'id848Ww1YLo',
  },
  {
    _id: 19, title: 'Bramayugam', year: 2024, genre: 'Horror', language: 'Malayalam', rating: 8.2, duration: '2h 19m', description: 'A folk singer in 17th century Malabar discovers a mysterious house with a dark owner.', poster: `${TMDB_BASE}/snQLwRrfQAl5YFKVefZq9Lbscki.jpg`, trailerId: '55pzldrBRJM',
  },
  {
    _id: 20, title: 'Parasite', year: 2019, genre: 'Thriller', language: 'Korean', rating: 9.2, duration: '2h 12m', description: 'Greed and class discrimination threaten the relationship between two Korean families.', poster: `${TMDB_BASE}/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg`, trailerId: '5xH0HfJHsaY',
  },
  {
    _id: 21, title: 'Train to Busan', year: 2016, genre: 'Horror', language: 'Korean', rating: 7.6, duration: '1h 58m', description: 'Passengers struggle to survive a zombie outbreak on a train from Seoul to Busan.', poster: `${TMDB_BASE}/vNVFt6dtcqnI7hqa6LFBUibuFiw.jpg`, trailerId: '1ovgxN2VWNc',
  },
  {
    _id: 22, title: 'Spirited Away', year: 2001, genre: 'Anime', language: 'Japanese', rating: 8.6, duration: '2h 5m', description: 'A 10-year-old girl wanders into a world ruled by gods, witches, and spirits.', poster: `${TMDB_BASE}/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg`, trailerId: 'ByXuk9QqQkk',
  },
  {
    _id: 23, title: 'Your Name', year: 2016, genre: 'Romance', language: 'Japanese', rating: 8.4, duration: '1h 46m', description: 'Two strangers find themselves linked in a bizarre way across time and space.', poster: `${TMDB_BASE}/q719jXXEzOoYaps6babgKnONONX.jpg`, trailerId: 'xU47nhruN-Q',
  },
  {
    _id: 24, title: 'Demon Slayer: Mugen Train', year: 2020, genre: 'Anime', language: 'Japanese', rating: 8.3, duration: '1h 57m', description: 'Tanjiro and friends join the Flame Hashira Rengoku on a mysterious train.', poster: `${TMDB_BASE}/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg`, trailerId: 'ATJYac_dORw',
  },
  {
    _id: 25, title: 'The Platform', year: 2019, genre: 'Sci-Fi', language: 'Spanish', rating: 7.0, duration: '1h 34m', description: 'A vertical prison with one food platform and two prisoners per level.', poster: `${TMDB_BASE}/iXvQnzy6JCAx1PiQEKXuTY04ZHl.jpg`, trailerId: 'RlfooqeZcdY',
  },
  {
    _id: 26, title: 'Money Heist: The Phenomenon', year: 2020, genre: 'Documentary', language: 'Spanish', rating: 7.6, duration: '1h 36m', description: 'A look at how the Spanish heist series became a global sensation.', poster: `${TMDB_BASE}/AboUXTrDWEi0PuZUqaft0iwBTm7.jpg`, trailerId: 'SDNV6LOmtDQ',
  },
  {
    _id: 27, title: 'F1', year: 2025, genre: 'Action', language: 'English', rating: 8.0, duration: '2h 30m', description: 'A former Formula 1 driver makes a comeback to mentor a young teammate.', poster: `${TMDB_BASE}/vqBmyAj0Xm9LnS1xe1MSlMAJyHq.jpg`, trailerId: '8yh9BPUBbbQ',
  },
  {
    _id: 28, title: 'Dhurandhar', year: 2025, genre: 'Action', language: 'Hindi', rating: 7.9, duration: '2h 20m', description: 'An undercover agent embarks on a high-stakes mission across international borders.', poster: `${TMDB_BASE}/w9Ww0iK2RqyVRsMcBDZiRZMQGJp.jpg`, trailerId: 'BKOVzHcjEIo',
  },
  {
    _id: 29, title: 'Kantara: Chapter 1', year: 2025, genre: 'Action', language: 'Kannada', rating: 8.5, duration: '2h 45m', description: 'A prequel exploring the origins of the Panjurli deity and the conflict over forest lands.', poster: `${TMDB_BASE}/qp5kkph47tTBVhrTEiJYZcQOkHL.jpg`, trailerId: 'TMQUFhWm8C0',
  },
  {
    _id: 30, title: 'Su', year: 2024, genre: 'Drama', language: 'Tamil', rating: 7.4, duration: '2h 10m', description: 'A gripping tale of survival and self-discovery in the modern urban landscape.', poster: `${TMDB_BASE}/bBpIvcapUYso04tcCbonZOn8dnz.jpg`, trailerId: 'Fe11GLdTL5k',
  },
  {
    _id: 31, title: 'Hera Pheri', year: 2000, genre: 'Comedy', language: 'Hindi', rating: 8.8, duration: '2h 36m', description: 'Three unemployed men look for answers to all their financial problems - but when they get involved in a kidnapping, they find themselves in even deeper trouble.', poster: `${TMDB_BASE}/23MKGUPT5laTStim4TaGhfgSltu.jpg`, trailerId: 'm1zMmVwWr-M',
  },
  {
    _id: 32, title: 'Bhool Bhulaiyaa', year: 2007, genre: 'Comedy Horror', language: 'Hindi', rating: 7.4, duration: '2h 34m', description: 'An NRI and his wife decide to stay in his ancestral home, paying no heed to the warnings about ghosts.', poster: `${TMDB_BASE}/soRW3p4GlPphHiFkwbqYGrodQ5S.jpg`, trailerId: 'ss-7iGf1xE8',
  },
  {
    _id: 33, title: 'The Hangover', year: 2009, genre: 'Comedy', language: 'English', rating: 7.7, duration: '1h 40m', description: 'Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing.', poster: `${TMDB_BASE}/A0uS9rHR56FeBtpjVki16M5xxSW.jpg`, trailerId: 'tcdUhdOlz9M',
  },
  {
    _id: 34, title: 'Doctor', year: 2021, genre: 'Comedy Action', language: 'Tamil', rating: 7.4, duration: '2h 28m', description: "A military doctor embarks on a journey with his former fiancée's family to find their missing daughter.", poster: `${TMDB_BASE}/ySPT0USsuDFG9pqHjI50GYOeQmj.jpg`, trailerId: 'oQiH_Iw0kDs',
  },
  {
    _id: 35, title: 'Love Today', year: 2022, genre: 'Comedy Romance', language: 'Tamil', rating: 8.1, duration: '2h 34m', description: 'A young couple is forced to exchange their phones for 24 hours to prove their love for each other.', poster: `${TMDB_BASE}/iRfIti4RhDFZ11UyCmz5Mk5wtGI.jpg`, trailerId: 'FaQe8JFGdaM',
  },
  {
    _id: 36, title: 'KGF: Chapter 1', year: 2018, genre: 'Action', language: 'Kannada', rating: 8.2, duration: '2h 36m', description: 'In the 1970s, a fierce rebel rises against brutal oppression and becomes the symbol of hope to legions of downtrodden people.', poster: `${TMDB_BASE}/ltHlJwvxKv7d0ooCiKSAvfwV9tX.jpg`, trailerId: 'qXgF-iJ_ezE',
  },
  {
    _id: 37, title: 'KGF: Chapter 2', year: 2022, genre: 'Action', language: 'Kannada', rating: 8.3, duration: '2h 48m', description: 'The blood-soaked land of Kolar Gold Fields has a new overlord now, Rocky, whose name strikes fear in the heart of his foes.', poster: `${TMDB_BASE}/khNVygolU0TxLIDWff5tQlAhZ23.jpg`, trailerId: 'Qah9sSIXJqk',
  },
  {
    _id: 38, title: 'Lucifer', year: 2019, genre: 'Action', language: 'Malayalam', rating: 7.5, duration: '2h 55m', description: "A political Godfather dies and a lot of thieves dressed up as politicians took over the rule. Question arises regarding the successor of the God, unfolding few names, along with the God's most beloved angel, Lucifer.", poster: `${TMDB_BASE}/fXgY2RCzoIJPhPDoyKRjaaqjIZs.jpg`, trailerId: 'x1-Ya0NZQso',
  },
  {
    _id: 39, title: 'Drishyam 2', year: 2021, genre: 'Thriller', language: 'Malayalam', rating: 8.4, duration: '2h 32m', description: 'A gripping tale of an investigation and a family which is threatened by it. Will Georgekutty be able to protect his family this time?', poster: `${TMDB_BASE}/8RJBCUGE27LX06tAES4jTELN0KA.jpg`, trailerId: '0f-nd1uGsjQ',
  },
  {
    _id: 40, title: 'Baahubali: The Beginning', year: 2015, genre: 'Action', language: 'Telugu', rating: 8.0, duration: '2h 39m', description: 'In ancient India, an adventurous and daring man becomes involved in a decades-old feud between two warring peoples.', poster: `${TMDB_BASE}/9BAjt8nSSms62uOVYn1t3C3dVto.jpg`, trailerId: '3NQRhE772b0',
  },
  {
    _id: 41, title: 'Baahubali 2: The Conclusion', year: 2017, genre: 'Action', language: 'Telugu', rating: 8.2, duration: '2h 47m', description: 'Amarendra Baahubali, the heir apparent to the throne of Mahishmati, finds his life and relationships endangered as his adoptive brother Bhallaladeva conspires to claim the throne.', poster: `${TMDB_BASE}/21sC2assImQIYCEDA84Qh9d1RsK.jpg`, trailerId: 'qD-6d8Wo3do',
  },
  {
    _id: 42, title: 'Kaithi', year: 2019, genre: 'Action', language: 'Tamil', rating: 8.5, duration: '2h 25m', description: 'Dilli, an ex-convict, endeavors to meet his daughter for the first time after leaving prison.', poster: `${TMDB_BASE}/mxvOvom5zKRp4WPURKrhjoatt4P.jpg`, trailerId: 'g79CvhHaj5I',
  },
  {
    _id: 43, title: 'Ayyappanum Koshiyum', year: 2020, genre: 'Action', language: 'Malayalam', rating: 8.0, duration: '2h 57m', description: 'The story is about the clash between Ayyappan, a senior police officer and Havildar Koshi.', poster: `${TMDB_BASE}/M1YQJ8lI7h9oJ9oxRKyMUzGwBh.jpg`, trailerId: '87XU97BfUp8',
  },
  {
    _id: 44, title: 'Asuran', year: 2019, genre: 'Action Drama', language: 'Tamil', rating: 8.4, duration: '2h 21m', description: 'A farmer from an underprivileged caste saves his hot-blooded son who kills a rich landlord.', poster: `${TMDB_BASE}/Elnp3XrAlMM30dil8rbL7D9XeP.jpg`, trailerId: 'vOCM9wztBYQ',
  },
  {
    _id: 45, title: 'Dangal', year: 2016, genre: 'Biography', language: 'Hindi', rating: 8.3, duration: '2h 41m', description: 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory.', poster: `${TMDB_BASE}/3n8888uKuaxPBBuDUqJhfhrWlgA.jpg`, trailerId: 'x_7YlGv9u1g',
  },
  {
    _id: 46, title: '3 Idiots', year: 2009, genre: 'Comedy Drama', language: 'Hindi', rating: 8.4, duration: '2h 50m', description: 'Two friends are searching for their long lost companion and revisit their college days.', poster: `${TMDB_BASE}/66A9MqXOyVFCssoloscw79z8Tew.jpg`, trailerId: 'K0eDlFX9GMc',
  },
  {
    _id: 47, title: 'Jersey', year: 2019, genre: 'Drama', language: 'Telugu', rating: 8.5, duration: '2h 37m', description: 'A failed cricketer decides to return to cricket in his late thirties to represent India.', poster: `${TMDB_BASE}/bU9q9yVtxeBiC0Do27CekHXNE6D.jpg`, trailerId: 'AjAe_Q1WZ_8',
  },
  {
    _id: 48, title: 'Article 15', year: 2019, genre: 'Thriller Drama', language: 'Hindi', rating: 8.1, duration: '2h 10m', description: 'A police officer sets out on a crusade against violent caste-based crimes in rural India.', poster: `${TMDB_BASE}/egknEWNt2B0slG2OC0gSpLZdVHj.jpg`, trailerId: 'HKOJY0cU63E',
  },
  {
    _id: 49, title: 'Minnal Murali', year: 2021, genre: 'Action Comedy', language: 'Malayalam', rating: 7.9, duration: '2h 38m', description: 'A tailor gains special powers after being struck by lightning.', poster: `${TMDB_BASE}/efetKFDyptrRpoHBb103Tg3Auw5.jpg`, trailerId: 'zAUAliz1TKA',
  },
  {
    _id: 50, title: 'Rangasthalam', year: 2018, genre: 'Action Drama', language: 'Telugu', rating: 8.2, duration: '2h 50m', description: 'A hearing-impaired sound engineer takes things into his own hands against a dictator.', poster: `${TMDB_BASE}/yiEzDgBBFC25Zd6z0r7sMngn5vr.jpg`, trailerId: 'sueMmTm-M4Y',
  },
  {
    _id: 51, title: 'Kantara', year: 2022, genre: 'Action Thriller', language: 'Kannada', rating: 8.3, duration: '2h 28m', description: 'A young tribal reluctantly dons the traditions of his ancestors to seek justice.', poster: `${TMDB_BASE}/jIsKmkxMzdCZ0Ux1GVSnu8m6Na6.jpg`, trailerId: '8mrVmf239GU',
  },
  {
    _id: 52, title: 'Pariyerum Perumal', year: 2018, genre: 'Drama', language: 'Tamil', rating: 8.7, duration: '2h 34m', description: 'A law student from a lower caste begins a friendship with his upper-caste classmate.', poster: `${TMDB_BASE}/78YoIO3gzkZPC1jotfDmolNDmgT.jpg`, trailerId: 'GMNsUxJe4R4',
  },
  {
    _id: 53, title: 'Kumbalangi Nights', year: 2019, genre: 'Comedy Drama', language: 'Malayalam', rating: 8.6, duration: '2h 15m', description: 'Four brothers who share a love-hate relationship progress to another level.', poster: `${TMDB_BASE}/lJ3RvIirE2C7gdBKvPRaoQ3iCo2.jpg`, trailerId: '3P4BFBSafF0',
  },
  {
    _id: 54, title: 'Andhadhun', year: 2018, genre: 'Thriller', language: 'Hindi', rating: 8.2, duration: '2h 19m', description: 'A series of mysterious events change the life of a blind pianist.', poster: `${TMDB_BASE}/dy3K6hNvwE05siGgiLJcEiwgpdO.jpg`, trailerId: '2iVYI99VGaw',
  },
  {
    _id: 55, title: 'Sita Ramam', year: 2022, genre: 'Romance Drama', language: 'Telugu', rating: 8.6, duration: '2h 43m', description: 'An orphan soldier gets a letter from a girl named Sita, and love blossoms.', poster: `${TMDB_BASE}/t1O94ZBzsQXJihtVkrsStRLyUDR.jpg`, trailerId: 'Ljk6tGZ1l3A',
  },
  {
    _id: 56, title: 'Soorarai Pottru', year: 2020, genre: 'Drama', language: 'Tamil', rating: 8.7, duration: '2h 33m', description: 'Maara sets out to make the common man fly in a capital intensive industry.', poster: `${TMDB_BASE}/5uimlxPCgAei8JfQUDFEUQLoyyh.jpg`, trailerId: 'fa_DIwRsa9o',
  },
  {
    _id: 57, title: 'PK', year: 2014, genre: 'Comedy Drama', language: 'Hindi', rating: 8.1, duration: '2h 33m', description: 'An alien on Earth loses the only device he can use to communicate with his spaceship.', poster: `${TMDB_BASE}/z2x2Y4tncefsIU7h82gmUM5vnBJ.jpg`, trailerId: 'SOXWc32k4zA',
  },
  {
    _id: 58, title: 'Thani Oruvan', year: 2015, genre: 'Action Thriller', language: 'Tamil', rating: 8.4, duration: '2h 30m', description: 'An IPS officer aims to expose a powerful scientist who commits medical malpractices.', poster: `${TMDB_BASE}/90ZpZw1qZlt0RUVByJATFVUEeEm.jpg`, trailerId: 'r5Lih8rKd6k',
  },
  {
    _id: 59, title: 'Gully Boy', year: 2019, genre: 'Drama Music', language: 'Hindi', rating: 7.9, duration: '2h 34m', description: 'A coming-of-age story based on the lives of street rappers in Mumbai.', poster: `${TMDB_BASE}/4RE7TD5TqEXbPKyUHcn7CSeMlrJ.jpg`, trailerId: 'JfbxcD6biOk',
  },
  {
    _id: 60, title: 'Arjun Reddy', year: 2017, genre: 'Romance Drama', language: 'Telugu', rating: 8.0, duration: '3h 2m', description: 'A short-tempered house surgeon gets used to drugs when his girlfriend is forced to marry.', poster: `${TMDB_BASE}/kHubDgL59I5hCn7ccBYvU7bKY1r.jpg`, trailerId: 'aozErj9NqeE',
  },
  {
    _id: 61, title: 'Premam', year: 2015, genre: 'Romance Drama', language: 'Malayalam', rating: 8.3, duration: '2h 36m', description: 'A young man has three opportunities to find love. Will the third time be the charm?', poster: `${TMDB_BASE}/wfMgsfDrtouYOM6MbrkHtU96Xij.jpg`, trailerId: 'tRQeIsxaBkg',
  },
  {
    _id: 62, title: 'Gangs of Wasseypur', year: 2012, genre: 'Action Crime', language: 'Hindi', rating: 8.2, duration: '5h 21m', description: 'A blood feud spanning three generations ignites in Wasseypur.', poster: `${TMDB_BASE}/xAy208Znkingmfnb5ZbULwLyIwW.jpg`, trailerId: '9ZpPQdrHfl8',
  },
  {
    _id: 63, title: 'Super Deluxe', year: 2019, genre: 'Thriller Drama', language: 'Tamil', rating: 8.3, duration: '2h 56m', description: 'Four stories of people in unexpected predicaments all on one fateful day.', poster: `${TMDB_BASE}/rTsYDdFWyw87CTk4YgJO6nYmVcJ.jpg`, trailerId: '3-Xq_Zz3nPA',
  },
  {
    _id: 64, title: 'Mahanati', year: 2018, genre: 'Biography Drama', language: 'Telugu', rating: 8.4, duration: '2h 57m', description: 'Biography of Savitri, an actress who ruled the South Indian industry.', poster: `${TMDB_BASE}/5hwtlwoLdSpkoeusT0sf8qW5VFB.jpg`, trailerId: 'PLmBpf7UHJs',
  },
  {
    _id: 65, title: 'Ustad Hotel', year: 2012, genre: 'Drama', language: 'Malayalam', rating: 8.2, duration: '2h 31m', description: "A young man with dreams of becoming a chef in Europe works in his grandfather's hotel.", poster: `${TMDB_BASE}/iRt4DeK5Ll8QTwJ3f3ngtkYQQlq.jpg`, trailerId: 'rhfVeDnd7-M',
  },
  {
    _id: 66, title: 'Kahaani', year: 2012, genre: 'Thriller', language: 'Hindi', rating: 8.1, duration: '2h 2m', description: "A pregnant woman's search for her missing husband takes her to Kolkata.", poster: `${TMDB_BASE}/eJpl0LdFTSA3wcPYtUUgbsBxPbe.jpg`, trailerId: 'ZOvEe_rd9SI',
  },
  {
    _id: 67, title: 'Ratsasan', year: 2018, genre: 'Action Crime', language: 'Tamil', rating: 8.3, duration: '2h 50m', description: 'A sub-inspector sets out in pursuit of a mysterious serial killer.', poster: `${TMDB_BASE}/mruUFlrVKiL994y3vvQBT8R2Vnf.jpg`, trailerId: 'GsrN7rNch9Y',
  },
  {
    _id: 68, title: 'Eega', year: 2012, genre: 'Action Comedy', language: 'Telugu', rating: 7.7, duration: '2h 25m', description: 'A murdered man is reincarnated as a housefly and seeks to avenge his death.', poster: `${TMDB_BASE}/3VovbDY0VisdNH1Rew43nEu11uD.jpg`, trailerId: 'x-1ZoU1xB4I',
  },
  {
    _id: 69, title: 'Bangalore Days', year: 2014, genre: 'Comedy Drama', language: 'Malayalam', rating: 8.3, duration: '2h 51m', description: 'A fun roller coaster ride about three cousins who reach Bangalore to discover.', poster: `${TMDB_BASE}/iFMyZw1DTGvZ8hPa0eTseSFiRT1.jpg`, trailerId: 'Gdzif0Px_qY',
  },
  {
    _id: 70, title: 'Tumbbad', year: 2018, genre: 'Drama Fantasy', language: 'Hindi', rating: 8.2, duration: '1h 44m', description: 'A mythological story about consequences when humans build a temple for a goddess.', poster: `${TMDB_BASE}/RMhsPDtWzqTwKssE8nzvJ3Zrk5.jpg`, trailerId: 'O9CaB4J4VEI',
  },
  {
    _id: 71, title: 'Vishwaroopam', year: 2013, genre: 'Action Thriller', language: 'Tamil', rating: 7.9, duration: '2h 28m', description: "A classical dancer's suspicious wife sets an investigator behind him.", poster: `${TMDB_BASE}/6j0ie6qImOH0ndS7uaZb4879PwC.jpg`, trailerId: 'T2F6euNVT5Y',
  },
  {
    _id: 72, title: 'Magadheera', year: 2009, genre: 'Action Fantasy', language: 'Telugu', rating: 7.7, duration: '2h 46m', description: 'A bike stuntman recalls his previous life as a warrior pursuing his love.', poster: `${TMDB_BASE}/xK7MEV56GF291VG0U5XnVJuvNv3.jpg`, trailerId: 'NXfhuqDNxg4',
  },
  {
    _id: 73, title: 'Maheshinte Prathikaaram', year: 2016, genre: 'Comedy Drama', language: 'Malayalam', rating: 8.3, duration: '2h 0m', description: 'A studio photographer gets into a fight and pledges to not wear slippers till he avenges.', poster: `${TMDB_BASE}/hmK9QUWpOaSs1H7tarzlMNqT60H.jpg`, trailerId: '_KY8Du4WWew',
  },
  {
    _id: 74, title: 'Bhaag Milkha Bhaag', year: 2013, genre: 'Biography Drama', language: 'Hindi', rating: 8.2, duration: '3h 9m', description: 'The truth behind the ascension of Milkha Singh who was scarred by the partition.', poster: `${TMDB_BASE}/bXywc0CEzS1fIshPWWi4V8A58U3.jpg`, trailerId: 'WbblCMem1ME',
  },
  {
    _id: 75, title: 'Mankatha', year: 2011, genre: 'Action Crime', language: 'Tamil', rating: 7.6, duration: '2h 35m', description: 'Suspended inspector Vinayak joins a group planning to whisk away 500 crore rupees.', poster: `${TMDB_BASE}/tZnDKJyUYfZKKPfBgVheU9vKlUo.jpg`, trailerId: 'vHESM8iR1JE',
  },
  {
    _id: 76, title: 'Ala Vaikunthapurramuloo', year: 2020, genre: 'Action Comedy', language: 'Telugu', rating: 7.3, duration: '2h 45m', description: 'A man grows up poor despite his biological father being a millionaire.', poster: `${TMDB_BASE}/goVGxWzvxs8oMNJ1Zc0QmfJlIzs.jpg`, trailerId: 'SkENAjfVoNI',
  },
  {
    _id: 77, title: 'Sudani from Nigeria', year: 2018, genre: 'Comedy Drama', language: 'Malayalam', rating: 8.2, duration: '2h 3m', description: 'An African football player in Kerala develops a deep bond with his manager.', poster: `${TMDB_BASE}/53yLPoLX8c9nAGLfmnNdF01zrNc.jpg`, trailerId: 'EHyaTJGmN4k',
  },
  {
    _id: 78, title: 'Sholay', year: 1975, genre: 'Action Adventure', language: 'Hindi', rating: 8.1, duration: '3h 24m', description: 'A former police officer enlists two outlaws to capture a ruthless bandit.', poster: `${TMDB_BASE}/ya9bwgqA4eNl5bQ9QqS0jcmRoBS.jpg`, trailerId: 'u2pJU82Xj9M',
  },
  {
    _id: 79, title: 'Pudhupettai', year: 2006, genre: 'Action Crime', language: 'Tamil', rating: 8.5, duration: '2h 48m', description: "A high school kid joins a local gang to survive after his mother's death.", poster: `${TMDB_BASE}/tDHgRk7Q0YjpXennMPUXpZrB1gQ.jpg`, trailerId: 'KwU1yCeHrkQ',
  },
  {
    _id: 80, title: 'Pushpa: The Rise', year: 2021, genre: 'Action Crime', language: 'Telugu', rating: 7.6, duration: '2h 59m', description: 'A labourer rises through the ranks of a red sandal smuggling syndicate.', poster: `${TMDB_BASE}/ry22efULBJNUS0IQDVCd6qJ2ECo.jpg`, trailerId: 'pK7W_S3ID-w',
  },
  {
    _id: 81, title: 'Malik', year: 2021, genre: 'Action Crime', language: 'Malayalam', rating: 8.1, duration: '2h 42m', description: 'A dark crime thriller revolving around the life of Sulaiman Malik.', poster: `${TMDB_BASE}/kFBvlw5oiHghwqraQNhqpljsg91.jpg`, trailerId: 'jLGKsg630EQ',
  },
  {
    _id: 82, title: 'Lagaan', year: 2001, genre: 'Drama Sport', language: 'Hindi', rating: 8.1, duration: '3h 44m', description: 'Villagers in Victorian India stake their future on a game of cricket.', poster: `${TMDB_BASE}/yNX9lFRAFeNLNRIXdqZK9gYrYKa.jpg`, trailerId: 'Nhi4Azs2nEw',
  },
  {
    _id: 83, title: 'Aayirathil Oruvan', year: 2010, genre: 'Action Adventure', language: 'Tamil', rating: 8.0, duration: '3h 20m', description: 'An expedition searches for an extinct Chola dynasty in Vietnam.', poster: `${TMDB_BASE}/9lrbtKE8vKIpYXxjj0hSwhnC81o.jpg`, trailerId: '-I9O5r2-lA0',
  },
  {
    _id: 84, title: 'Srimanthudu', year: 2015, genre: 'Action Drama', language: 'Telugu', rating: 7.5, duration: '2h 43m', description: 'A multi-millionaire decides to adopt a village to bring change.', poster: `${TMDB_BASE}/tSExcPspjLy156vE2Rd4XOgpo15.jpg`, trailerId: 'O8Z9mQ1TjYk',
  },
  {
    _id: 85, title: 'Jallikattu', year: 2019, genre: 'Action Thriller', language: 'Malayalam', rating: 7.5, duration: '1h 31m', description: 'A portrait of a remote village where a buffalo escapes and causes frenzy.', poster: `${TMDB_BASE}/8pEsTp9bS6yjr9P9K43vPP8mw1v.jpg`, trailerId: 'ItcQNybOOHM',
  },
];

const THEATRES_SEED = [
  {
    _id: 1, name: 'PVR IMAX Phoenix', location: 'Lower Parel', city: 'Mumbai', shows: [{ time: '10:30 AM', format: 'IMAX' }, { time: '1:45 PM', format: '3D' }, { time: '5:00 PM', format: 'IMAX' }, { time: '8:30 PM', format: '2D' }, { time: '10:45 PM', format: '3D' }],
  },
  {
    _id: 2, name: 'INOX Megaplex R City', location: 'Ghatkopar', city: 'Mumbai', shows: [{ time: '11:00 AM', format: '2D' }, { time: '2:15 PM', format: '3D' }, { time: '6:00 PM', format: '2D' }, { time: '9:30 PM', format: '3D' }],
  },
  {
    _id: 3, name: 'Cinepolis DLF', location: 'Vasant Kunj', city: 'Delhi', shows: [{ time: '9:30 AM', format: '2D' }, { time: '12:45 PM', format: 'IMAX' }, { time: '4:00 PM', format: '3D' }, { time: '7:15 PM', format: 'IMAX' }, { time: '10:30 PM', format: '2D' }],
  },
  {
    _id: 4, name: 'PVR Orion Mall', location: 'Rajajinagar', city: 'Bangalore', shows: [{ time: '10:00 AM', format: '3D' }, { time: '1:30 PM', format: '2D' }, { time: '5:30 PM', format: 'IMAX' }, { time: '9:00 PM', format: '2D' }],
  },
  {
    _id: 5, name: 'Nexus Koramangala', location: 'Koramangala', city: 'Bangalore', shows: [{ time: '12:00 PM', format: '2D' }, { time: '4:15 PM', format: '3D' }, { time: '8:00 PM', format: '2D' }, { time: '10:30 PM', format: 'IMAX' }],
  },
  {
    _id: 6, name: 'Phoenix Marketcity', location: 'Mahadevapura', city: 'Bangalore', shows: [{ time: '9:30 AM', format: 'IMAX' }, { time: '1:15 PM', format: '2D' }, { time: '5:30 PM', format: '3D' }, { time: '9:30 PM', format: 'IMAX' }],
  },
  {
    _id: 7, name: 'SPI Palazzo Focus Mall', location: 'Anna Nagar', city: 'Chennai', shows: [{ time: '11:30 AM', format: '2D' }, { time: '3:00 PM', format: '3D' }, { time: '6:30 PM', format: '2D' }, { time: '9:45 PM', format: 'IMAX' }],
  },
  {
    _id: 8, name: 'Prasads IMAX', location: 'Khairatabad', city: 'Hyderabad', shows: [{ time: '10:00 AM', format: 'IMAX' }, { time: '1:30 PM', format: '2D' }, { time: '5:30 PM', format: 'IMAX' }, { time: '9:00 PM', format: '2D' }],
  },
  {
    _id: 9, name: 'Asian Satyam Mall', location: 'Ameerpet', city: 'Hyderabad', shows: [{ time: '11:00 AM', format: '2D' }, { time: '2:15 PM', format: '3D' }, { time: '6:00 PM', format: '2D' }, { time: '9:30 PM', format: '3D' }],
  },
  {
    _id: 10, name: 'South City INOX', location: 'Prince Anwar Shah Rd', city: 'Kolkata', shows: [{ time: '11:30 AM', format: '2D' }, { time: '3:00 PM', format: '3D' }, { time: '6:30 PM', format: '2D' }, { time: '9:45 PM', format: 'IMAX' }],
  },
  {
    _id: 11, name: 'PVR ICON Pavillion', location: 'Senapati Bapat Rd', city: 'Pune', shows: [{ time: '10:15 AM', format: '2D' }, { time: '1:30 PM', format: '3D' }, { time: '4:45 PM', format: '2D' }, { time: '8:00 PM', format: '2D' }],
  },
  {
    _id: 12, name: 'Lulu Mall PVR', location: 'Edappally', city: 'Kochi', shows: [{ time: '9:30 AM', format: '2D' }, { time: '12:45 PM', format: '2D' }, { time: '4:00 PM', format: '2D' }, { time: '7:15 PM', format: '2D' }, { time: '10:30 PM', format: '2D' }],
  },
  {
    _id: 13, name: 'The Cinema Brookefields', location: 'Brookefields Mall', city: 'Coimbatore', shows: [{ time: '11:00 AM', format: '2D' }, { time: '2:30 PM', format: '2D' }, { time: '6:00 PM', format: '2D' }, { time: '9:30 PM', format: '2D' }],
  },
  {
    _id: 14, name: 'Cinepolis Alpha One', location: 'Vastrapur', city: 'Ahmedabad', shows: [{ time: '10:45 AM', format: '2D' }, { time: '2:00 PM', format: '3D' }, { time: '5:15 PM', format: '2D' }, { time: '8:30 PM', format: '2D' }],
  },
  {
    _id: 15, name: 'INOX Prozone Mall', location: 'Chikhalthana', city: 'Aurangabad', shows: [{ time: '12:00 PM', format: '2D' }, { time: '3:30 PM', format: '2D' }, { time: '7:00 PM', format: '2D' }, { time: '10:15 PM', format: '2D' }],
  },
];

module.exports = async (req, res) => {
  try {
    const { db } = await connectToDatabase();

    await db.collection('movies').deleteMany({});
    await db.collection('theatres').deleteMany({});

    const moviesResult = await db.collection('movies').insertMany(MOVIES_SEED);
    const theatresResult = await db.collection('theatres').insertMany(THEATRES_SEED);

    res.status(200).json({
      message: 'Database seeded with verified TMDB poster URLs!',
      moviesInserted: moviesResult.insertedCount,
      theatresInserted: theatresResult.insertedCount,
    });
  } catch (error) {
    console.error('Error seeding DB:', error);
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
};
