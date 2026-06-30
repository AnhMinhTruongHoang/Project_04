import { authOptions } from "@/app/api/auth/auth.options"
import AuthSignUp from "@/components/auth/auth.signup"
import { getServerSession } from "next-auth/next"
import { redirect } from 'next/navigation'


const SignUpPage = async () => {
    const session = await getServerSession(authOptions);
    if (session) {
        // redirect to homepage
        redirect("/")
    }
    return (
        <AuthSignUp />
    )
}

export default SignUpPage;