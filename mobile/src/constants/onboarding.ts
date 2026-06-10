export type OnboardingSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'premium-gadgets',
    title: 'Premium Gadgets',
    subtitle: 'Discover the latest tech at your fingertips',
    image: require('../../assets/images/smartphone.png'),
  },
  {
    id: 'instant-access',
    title: 'Instant Access',
    subtitle: 'Premium gadgets, simplified',
    image: require('../../assets/images/earbuds.png'),
  },
  {
    id: 'flexible-payment',
    title: 'Flexible Payment',
    subtitle: 'Buy now or pay later - your choice',
    image: require('../../assets/images/speaker.png'),
  },
];
