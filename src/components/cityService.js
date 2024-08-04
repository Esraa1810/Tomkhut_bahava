import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig' ;
import HomeButton from './HomeButton'; // Import HomeButton component


const cities = [
  'ירושלים',
  'תל אביב',
  'חיפה',
  'באר שבע',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'רעננה',
  'הרצליה',
  'חולון',
  'רמת גן',
  'בית שמש',
  'אשקלון',
  'רחובות',
  'בת ים',
  'חדרה',
  'כפר סבא',
  'מודיעין-מכבים-רעות',
  'לוד',
  'מודיעין עילית',
  'רמלה',
  'נצרת',
  'רהט',
  'ראש העין',
  'קריית גת',
  'ביתר עילית',
  'נהריה',
  'הוד השרון',
  'גבעתיים',
  'עפולה',
  'קריית אתא',
  'אום אל-פחם',
  'יבנה',
  'אילת',
  'עכו',
  'נס ציונה',
  'אלעד',
  'טבריה',
  'רמת השרון',
  'קריית מוצקין',
  'כרמיאל',
  'נתיבות',
  'טייבה',
  'קריית ביאליק',
  'נוף הגליל',
  'שפרעם',
  'קריית אונו',
  'קריית ים',
  'מעלה אדומים',
  'צפת',
  'אור יהודה',
  'דימונה',
  'טמרה',
  'אופקים',
  'חריש',
  'סחנין',
  'שדרות',
  'באקה אל-גרבייה',
  'יהוד-מונוסון',
  'באר יעקב',
  'כפר יונה',
  'גבעת שמואל',
  'טירת כרמל',
  'ערד',
  'עראבה',
  'טירה',
  'מגדל העמק',
  'קריית מלאכי',
  'כפר קאסם',
  'יקנעם עילית',
  'קלנסווה',
  'גני תקווה',
  'נשר',
  'מעלות-תרשיחא',
  'קריית שמונה',
  'אור עקיבא',
  'אריאל',
  'כפר קרע',
  'בית שאן' ,
  'אחר'
];

const fetchCities = async () => {
  try {
    const citiesRef = collection(db, 'cities');
    const citiesSnapshot = await getDocs(citiesRef);
    const fetchedCities = citiesSnapshot.docs.map(doc => doc.data().name);
    return [...cities, ...fetchedCities];
  } catch (error) {
    console.error('Error fetching cities: ', error);
    return cities;
  }
};

export { fetchCities };
