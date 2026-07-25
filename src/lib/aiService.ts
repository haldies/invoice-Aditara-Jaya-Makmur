interface AIContext {
  position?: string;
  company?: string;
  skills?: string[];
  experiences?: Array<{
    position: string;
    company: string;
    description: string[];
  }>;
  bulletPoint?: string;
  experienceContext?: string;
}

// Mock AI service - replace with actual AI API if needed
export async function generateSummary(context: AIContext): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { position, skills, experiences } = context;
  
  const skillsText = skills && skills.length > 0 
    ? skills.slice(0, 3).join(", ") 
    : "berbagai bidang";
  
  const experienceText = experiences && experiences.length > 0
    ? experiences[0].company
    : "berbagai perusahaan";
  
  const positionText = position || "Professional";
  
  return `${positionText} dengan pengalaman di ${experienceText}. Memiliki keahlian dalam ${skillsText} dan berdedikasi untuk memberikan hasil terbaik.`;
}

export async function improveBulletPoint(
  bulletPoint: string,
  experienceContext: string
): Promise<string> {
  void experienceContext;
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple improvement: capitalize first letter and ensure proper punctuation
  const improved = bulletPoint.trim();
  const capitalized = improved.charAt(0).toUpperCase() + improved.slice(1);
  const withPunctuation = capitalized.endsWith('.') ? capitalized : capitalized + '.';
  
  return withPunctuation;
}
