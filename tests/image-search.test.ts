import assert from 'node:assert/strict'
import test from 'node:test'
import { searchUnsplash, searchWikimedia } from '../src/lib/image-search'

test('provider outages are errors, while successful empty searches stay empty',async()=>{
 const original=globalThis.fetch;const key=process.env.UNSPLASH_ACCESS_KEY
 process.env.UNSPLASH_ACCESS_KEY='test'
 try{
 globalThis.fetch=async()=>new Response('{}',{status:429})
 await assert.rejects(searchUnsplash('kitchen',1),/429/)
 await assert.rejects(searchWikimedia('kitchen',1),/429/)
 globalThis.fetch=async()=>new Response(JSON.stringify({results:[],query:{pages:{}}}))
 assert.deepEqual(await searchUnsplash('kitchen',1),[])
 assert.deepEqual(await searchWikimedia('kitchen',1),[])
 delete process.env.UNSPLASH_ACCESS_KEY
 await assert.rejects(searchUnsplash('kitchen',1),/not configured/)
 }finally{globalThis.fetch=original;if(key)process.env.UNSPLASH_ACCESS_KEY=key;else delete process.env.UNSPLASH_ACCESS_KEY}
})
test('Unsplash search distinguishes the image asset from download tracking',async()=>{
 const original=globalThis.fetch;const key=process.env.UNSPLASH_ACCESS_KEY;process.env.UNSPLASH_ACCESS_KEY='test'
 try{
 globalThis.fetch=async()=>new Response(JSON.stringify({results:[{id:'photo',urls:{regular:'https://images.unsplash.com/photo-test',small:'https://images.unsplash.com/photo-test?w=400'},description:null,alt_description:'A bright kitchen',width:1200,height:800,user:{name:'Photographer'},links:{download_location:'https://api.unsplash.com/photos/photo/download'}}]}))
 const [result]=await searchUnsplash('kitchen',1)
 assert.equal(new URL(result.url).hostname,'images.unsplash.com')
 assert.equal(new URL(result.downloadUrl).hostname,'api.unsplash.com')
 assert.equal(result.title,'A bright kitchen')
 }finally{globalThis.fetch=original;if(key)process.env.UNSPLASH_ACCESS_KEY=key;else delete process.env.UNSPLASH_ACCESS_KEY}
})
