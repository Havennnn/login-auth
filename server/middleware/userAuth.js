import jwt from 'jsonwebtoken'

const userAuth = (req, res, next) => {
    const { token } = req.cookies

    if(!token) {
        return res.json({success: false, message: "Not Authorize to Login Again!"})
    }

    try {
        
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id
        } else {
            return res.json({success: false, message: "Not Authorize to Login Again!"})
        }

        next()

    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}
 
export default userAuth