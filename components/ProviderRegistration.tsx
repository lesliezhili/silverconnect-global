const createProviderProfile = async () => {
  setLoading(true)
  setError("")

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Please sign in first')
      setLoading(false)
      return
    }
    
    const requestBody = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      postcode: formData.postcode,
      suburb: formData.suburb,
      services: formData.services,
      experience: formData.experience,
      certifications: formData.certifications,
      bio: formData.bio,
      is_christian: formData.is_christian,
      faith_background: formData.faith_background,
    }

    const response = await fetch("/api/provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to upgrade to provider")
    }

    if (data.provider?.id) {
      setProviderId(data.provider.id)
      setStep(4)
    }
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}