import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowRight, X, CheckCircle2 } from 'lucide-react'; // ✅ Added CheckCircle2
import { publicCareerApi } from '@/api/publicCareerApi';

const Careers = () => {
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // ✅ New success state

  // Fetch live jobs from Port 8080 on mount
  useEffect(() => {
    publicCareerApi.getOpenJobs()
      .then(res => setOpenPositions(res.data))
      .catch(err => console.error("Could not load jobs", err));
  }, []);

  const benefits = [
    'Remote-first culture',
    'Flexible working hours',
    'Creative freedom',
    'Professional development',
    'Collaborative environment',
    'Industry-leading compensation',
  ];

  // Handle Dual-Service Submission
  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const file = formData.get('resume') as File;
      
      // 1. Upload to Asset Service (Port 8090)
      const uploadRes = await publicCareerApi.uploadResume(file);
      const resumeUuid = uploadRes.data.uuid;

      // 2. Submit metadata to Admin Service (Port 8080)
      await publicCareerApi.submitApplication({
        jobId: selectedJob.id,
        fullName: formData.get('fullName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        resumeAssetUuid: resumeUuid
      });

      // ✅ Switch to UI Success State
      setIsSuccess(true);
      
      // Auto-close modal after 6 seconds if user doesn't click close
      setTimeout(() => {
          if (isSuccess) handleCloseModal();
      }, 6000);

    } catch (err) {
      console.error("Submission error:", err);
      alert("Error submitting application. Please ensure you are uploading a PDF and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
      setSelectedJob(null);
      setIsSuccess(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Join Our Team
            </span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mt-3">
              Careers
            </h1>
          </div>

          {/* Introduction */}
          <section className="text-center mb-16">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Join a team of passionate designers and innovators shaping the future 
              of digital textile design. We're always looking for talented individuals 
              who share our vision for excellence.
            </p>
          </section>

          {/* Why Work With Us */}
          <section className="mb-16 md:mb-20">
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-8 text-center">
              Why Work With Us
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="p-6 border border-border text-center hover:border-foreground/30 transition-colors">
                  <p className="text-sm md:text-base text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="font-serif text-2xl md:text-3xl font-medium mb-8 text-center">
              Open Positions
            </h2>
            <div className="space-y-4">
              {openPositions.length > 0 ? (
                openPositions.map((position) => (
                  <div 
                    key={position.id}
                    onClick={() => setSelectedJob(position)}
                    className="group p-6 border border-border hover:border-foreground/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-lg md:text-xl font-medium mb-2">
                          {position.title}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>{position.jobType}</span>
                          <span>·</span>
                          <span>{position.location}</span>
                          <span>·</span>
                          <span className="italic">{position.experienceLevel}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-10">No active openings at the moment. Check back soon!</p>
              )}
            </div>

            <p className="text-center text-muted-foreground mt-8 text-sm">
              Don't see a position that fits? Send your portfolio to{' '}
              <a href="mailto:careers@rdctextiles.com" className="text-foreground hover:underline">
                hr@ruchitadesigncompany.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* APPLICATION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-border w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300">
            {/* Close Button - hidden during success message for cleaner feel */}
            {!isSuccess && (
                <button onClick={handleCloseModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                </button>
            )}

            {isSuccess ? (
              /* ✅ REFINED SUCCESS UI */
              <div className="py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-6">
                  <CheckCircle2 className="h-12 w-12 text-foreground stroke-[1px]" />
                </div>
                <h2 className="font-serif text-2xl md:text-3xl mb-4">Application Sent</h2>
                <p className="text-muted-foreground leading-relaxed px-4">
                  Thank you for applying. We have received your application for the 
                  <span className="text-foreground font-medium"> {selectedJob.title} </span> 
                  role. A confirmation email has been sent to you.
                </p>
                <button 
                    onClick={handleCloseModal}
                    className="mt-8 text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground"
                >
                    Return to Careers
                </button>
              </div>
            ) : (
              /* FORM UI */
              <>
                <h2 className="font-serif text-2xl mb-2">Apply for {selectedJob.title}</h2>
                <p className="text-sm text-muted-foreground mb-6">{selectedJob.location} · {selectedJob.jobType}</p>
                
                <form onSubmit={handleApply} className="space-y-4">
                  <input name="fullName" type="text" placeholder="Full Name" required className="w-full p-3 border border-border bg-transparent outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50" />
                  <input name="email" type="email" placeholder="Email Address" required className="w-full p-3 border border-border bg-transparent outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50" />
                  <input name="phone" type="text" placeholder="Phone Number" required className="w-full p-3 border border-border bg-transparent outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50" />
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Upload Resume (PDF)</label>
                    <input 
                        name="resume" 
                        type="file" 
                        accept=".pdf" 
                        required 
                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:bg-foreground file:text-background hover:file:opacity-90 transition-all cursor-pointer" 
                    />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-foreground text-background text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-opacity mt-4"
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Application'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Careers;